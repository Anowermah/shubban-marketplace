import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getVerifiedSessionUser,
  isAdmin,
  isSuperAdmin,
  canManageUserRole,
  isSoleSuperAdmin,
  UserRole,
} from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        membershipTier: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        dateOfBirth: true,
        country: true,
        division: true,
        city: true,
        area: true,
        postalCode: true,
        fullAddress: true,
        isVerified: true,
        isPhoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'ব্যবহারকারী লোড ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস। শুধুমাত্র অ্যাডমিনের জন্য।' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true, role: true, status: true, membershipTier: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const { role, status, membershipTier, name, email, phone, username, password } = body;

    const updateData: Record<string, any> = {};
    const auditActions: string[] = [];

    // 1. RBAC Hierarchy verification if role is changing
    if (role && role !== targetUser.role) {
      const roleCheck = canManageUserRole(operator.role, targetUser.role, role as UserRole);
      if (!roleCheck.allowed) {
        return NextResponse.json(
          {
            error:
              roleCheck.reason ||
              `অনুমতি নেই: আপনার রোল (${operator.role}) দিয়ে লক্ষ্য ব্যবহারকারীর রোল (${targetUser.role}) পরিবর্তন করে (${role}) করা সম্ভব নয়।`,
          },
          { status: 403 }
        );
      }

      // Check sole super admin demotion protection
      if (targetUser.role === 'SUPER_ADMIN') {
        const isSole = await isSoleSuperAdmin(targetUser.id);
        if (isSole) {
          return NextResponse.json(
            { error: 'অপারেশন ব্যর্থ: প্ল্যাটফর্মে অন্তত একজন সক্রিয় সুপার অ্যাডমিনিস্ট্রেটর থাকা আবশ্যক।' },
            { status: 400 }
          );
        }
      }

      updateData.role = role;
      auditActions.push(`Role changed from ${targetUser.role} to ${role}`);
    }

    // 2. Status change handling & protections
    if (status && status !== targetUser.status) {
      if (targetUser.role === 'SUPER_ADMIN' && (status === 'SUSPENDED' || status === 'BLOCKED')) {
        const isSole = await isSoleSuperAdmin(targetUser.id);
        if (isSole) {
          return NextResponse.json(
            { error: 'অপারেশন ব্যর্থ: সিস্টেমের একমাত্র সুপার অ্যাডমিনকে স্থগিত বা ব্লক করা যাবে না।' },
            { status: 400 }
          );
        }
      }

      updateData.status = status;
      auditActions.push(`Status changed from ${targetUser.status} to ${status}`);
    }

    // 3. Membership tier
    if (membershipTier && membershipTier !== targetUser.membershipTier) {
      updateData.membershipTier = membershipTier;
      auditActions.push(`Membership tier changed to ${membershipTier}`);
    }

    // 4. Basic Profile fields
    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
      auditActions.push(`Name updated`);
    }
    if (typeof email === 'string' && email.trim() && email.trim().toLowerCase() !== targetUser.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (duplicate && duplicate.id !== targetUser.id) {
        return NextResponse.json({ error: 'এই ইমেইলটি ইতিমধ্যে অন্য একাউন্টে ব্যবহৃত হচ্ছে।' }, { status: 400 });
      }
      updateData.email = email.trim().toLowerCase();
      auditActions.push(`Email updated`);
    }
    if (typeof username === 'string') {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) {
        const duplicate = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (duplicate && duplicate.id !== targetUser.id) {
          return NextResponse.json({ error: 'এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হচ্ছে।' }, { status: 400 });
        }
        updateData.username = cleanUsername;
      } else {
        updateData.username = null;
      }
      auditActions.push(`Username updated`);
    }
    if (typeof phone === 'string') {
      updateData.phone = phone.trim() || null;
      auditActions.push(`Phone updated`);
    }

    // 5. Password Reset if provided
    if (typeof password === 'string' && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
      auditActions.push(`Password reset by admin`);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'কোনো পরিবর্তন চিহ্নিত হয়নি।' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        membershipTier: true,
        updatedAt: true,
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'ADMIN_USER_UPDATED',
          entity: 'User',
          entityId: targetUser.id,
          details: JSON.stringify({
            targetEmail: targetUser.email,
            changes: auditActions,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (logErr) {
      console.error('Audit log failed:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'ব্যবহারকারীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে।',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'ব্যবহারকারী আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// DELETE: Delete user account
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস। শুধুমাত্র অ্যাডমিনের জন্য।' }, { status: 403 });
    }

    const { id } = params;

    if (operator.id === id) {
      return NextResponse.json({ error: 'আপনি নিজের অ্যাকাউন্ট মুছতে পারবেন না।' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 404 });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      if (!isSuperAdmin(operator.role)) {
        return NextResponse.json({ error: 'শুধুমাত্র সুপার অ্যাডমিন এই অ্যাকাউন্টটি মুছতে পারেন।' }, { status: 403 });
      }
      const isSole = await isSoleSuperAdmin(targetUser.id);
      if (isSole) {
        return NextResponse.json({ error: 'প্ল্যাটফর্মের একমাত্র সুপার অ্যাডমিন মোছা সম্ভব নয়।' }, { status: 400 });
      }
    }

    // Attempt cascade cleanup of user
    try {
      // Clean up linked staff profile if any
      await prisma.staffProfile.deleteMany({ where: { userId: id } });
      // Delete user
      await prisma.user.delete({ where: { id } });
    } catch (cascadeError: any) {
      // If foreign keys prevent full deletion (orders, reviews, etc.), soft-delete/block
      await prisma.user.update({
        where: { id },
        data: {
          status: 'BLOCKED',
          adminNotes: `Deleted/Archived by Admin on ${new Date().toISOString()}`,
        },
      });
      return NextResponse.json({
        success: true,
        message: 'ব্যবহারকারীর সম্পর্কিত অর্ডার ও রেকর্ড থাকায় অ্যাকাউন্টটি স্থায়ীভাবে ব্লক ও আর্কাইভ করা হয়েছে।',
      });
    }

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'ADMIN_USER_DELETED',
          entity: 'User',
          entityId: id,
          details: JSON.stringify({ name: targetUser.name, email: targetUser.email, role: targetUser.role }),
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'ব্যবহারকারী অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'ব্যবহারকারী মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin, isSuperAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const tier = searchParams.get('tier') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { username: { contains: q } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (tier && tier !== 'ALL') {
      where.membershipTier = tier;
    }

    const [totalUsers, filteredCount, users, statusCounts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
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
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const stats = {
      total: totalUsers,
      active: statusCounts.find((s) => s.status === 'ACTIVE')?._count.id || 0,
      suspended: statusCounts.find((s) => s.status === 'SUSPENDED')?._count.id || 0,
      inactive: statusCounts.find((s) => s.status === 'INACTIVE')?._count.id || 0,
    };

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalItems: filteredCount,
        totalPages: Math.ceil(filteredCount / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'ব্যবহারকারী তালিকা লোড ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Create a new user by Admin
export async function POST(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস। শুধুমাত্র অ্যাডমিনের জন্য।' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, username, password, role = 'REGISTERED_MEMBER', status = 'ACTIVE', membershipTier = 'FREE' } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'ব্যবহারকারীর নাম ও ইমেইল আবশ্যক।' }, { status: 400 });
    }

    // Check unique email
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট বিদ্যমান।' }, { status: 400 });
    }

    // Check unique username if provided
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
      if (existingUsername) {
        return NextResponse.json({ error: 'এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 400 });
      }
    }

    // Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN
    if (['SUPER_ADMIN', 'ADMIN'].includes(role) && !isSuperAdmin(operator.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র সুপার অ্যাডমিন প্রশাসনিক রোল প্রদান করতে পারেন।' }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(password || 'Shubban@123456', 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        username: username ? username.trim().toLowerCase() : null,
        passwordHash,
        role,
        status,
        membershipTier,
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        membershipTier: true,
        createdAt: true,
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'ADMIN_USER_CREATED',
          entity: 'User',
          entityId: newUser.id,
          details: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role }),
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।',
      user: newUser,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'ব্যবহারকারী তৈরিতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

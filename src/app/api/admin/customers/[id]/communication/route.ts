import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { type, subject, message, link } = body;

    const customer = await prisma.user.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    if (type === 'PASSWORD_RESET') {
      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetLink = `/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(customer.email)}`;

      // Create in-app notification for the user
      await prisma.notification.create({
        data: {
          userId: id,
          title: 'পাসওয়ার্ড রিসেট লিঙ্ক অনুরোধ',
          message: `অ্যাডমিন আপনার জন্য একটি নিরাপদ পাসওয়ার্ড রিসেট অনুরোধ তৈরি করেছেন। অনুগ্রহ করে নিচের লিঙ্কে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।`,
          link: resetLink,
          type: 'SYSTEM',
        },
      });

      // Record audit log
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'DISPATCH_PASSWORD_RESET',
          entity: 'USER',
          entityId: id,
          details: `অ্যাডমিন ${adminUser.name} গ্রাহক ${customer.name} (${customer.email})-এর জন্য পাসওয়ার্ড রিসেট লিঙ্ক তৈরি করেছেন।`,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'পাসওয়ার্ড রিসেট অনুরোধ সফলভাবে তৈরি ও পাঠানো হয়েছে।',
        resetLink,
      });
    }

    // Direct message / System notice
    if (!subject || !message) {
      return NextResponse.json({ error: 'বার্তা বিষয় ও বিবরণ উভয়ই আবশ্যক।' }, { status: 400 });
    }

    await prisma.notification.create({
      data: {
        userId: id,
        title: subject.trim(),
        message: message.trim(),
        link: link?.trim() || null,
        type: type === 'ORDER_NOTICE' ? 'ORDER' : 'SYSTEM',
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'SEND_CUSTOMER_NOTICE',
        entity: 'USER',
        entityId: id,
        details: `বার্তা পাঠানো হয়েছে [${subject}]: ${message.slice(0, 80)}...`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'গ্রাহককে সফলভাবে বার্তা পাঠানো হয়েছে।',
    });
  } catch (error: any) {
    console.error('Customer communication error:', error);
    return NextResponse.json({ error: error.message || 'যোগাযোগ বার্তা পাঠাতে ব্যর্থ।' }, { status: 500 });
  }
}


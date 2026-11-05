import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { customerIds, action, tag, reason } = body;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json({ error: 'কমপক্ষে একজন গ্রাহক নির্বাচন করুন।' }, { status: 400 });
    }

    if (action === 'activate') {
      await prisma.user.updateMany({
        where: { id: { in: customerIds } },
        data: { status: 'ACTIVE' },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'BULK_ACTIVATE_CUSTOMERS',
          entity: 'USER',
          details: `মোট ${customerIds.length} জন গ্রাহককে বাল্ক সক্রিয় করা হয়েছে।`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${customerIds.length} জন গ্রাহক সফলভাবে সক্রিয় করা হয়েছে।`,
      });
    }

    if (action === 'deactivate') {
      await prisma.user.updateMany({
        where: { id: { in: customerIds } },
        data: { status: 'INACTIVE' },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'BULK_DEACTIVATE_CUSTOMERS',
          entity: 'USER',
          details: `মোট ${customerIds.length} জন গ্রাহককে বাল্ক নিষ্ক্রিয় করা হয়েছে।`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${customerIds.length} জন গ্রাহক সফলভাবে নিষ্ক্রিয় করা হয়েছে।`,
      });
    }

    if (action === 'suspend') {
      await prisma.user.updateMany({
        where: { id: { in: customerIds } },
        data: { status: 'SUSPENDED' },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'BULK_SUSPEND_CUSTOMERS',
          entity: 'USER',
          details: `মোট ${customerIds.length} জন গ্রাহককে বাল্ক স্থগিত করা হয়েছে। কারণ: ${reason || 'নেই'}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${customerIds.length} জন গ্রাহক সফলভাবে স্থগিত করা হয়েছে।`,
      });
    }

    if (action === 'verify') {
      await prisma.user.updateMany({
        where: { id: { in: customerIds } },
        data: { isVerified: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'BULK_VERIFY_CUSTOMERS',
          entity: 'USER',
          details: `মোট ${customerIds.length} জন গ্রাহককে বাল্ক ভেরিফাইড করা হয়েছে।`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${customerIds.length} জন গ্রাহকের ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।`,
      });
    }

    if (action === 'assign_tag') {
      if (!tag) {
        return NextResponse.json({ error: 'ট্যাগ নির্বাচন করুন।' }, { status: 400 });
      }

      // Fetch users to append tag
      const users = await prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, customerTags: true },
      });

      for (const u of users) {
        let tags: string[] = [];
        try {
          if (u.customerTags) tags = JSON.parse(u.customerTags);
        } catch {
          if (u.customerTags) tags = [u.customerTags];
        }
        if (!tags.includes(tag)) {
          tags.push(tag);
          await prisma.user.update({
            where: { id: u.id },
            data: { customerTags: JSON.stringify(tags) },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'BULK_ASSIGN_TAG',
          entity: 'USER',
          details: `মোট ${users.length} জন গ্রাহককে '${tag}' ট্যাগ যুক্ত করা হয়েছে।`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${users.length} জন গ্রাহককে '${tag}' ট্যাগ যুক্ত করা হয়েছে।`,
      });
    }

    if (action === 'delete') {
      // Find which users have orders
      const usersWithOrders = await prisma.user.findMany({
        where: {
          id: { in: customerIds },
          orders: { some: {} },
        },
        select: { id: true, name: true, email: true },
      });

      const protectedIds = new Set(usersWithOrders.map((u) => u.id));
      const deletableIds = customerIds.filter((id) => !protectedIds.has(id));

      if (deletableIds.length === 0) {
        return NextResponse.json(
          {
            error: `নির্বাচিত সব গ্রাহকের (${usersWithOrders.length} জন) অর্ডার রেকর্ড রয়েছে। আর্থিক ও ট্যাক্স রেকর্ড সুরক্ষার জন্য তাদের মোছা সম্ভব নয়। অ্যাকাউন্ট নিষ্ক্রিয় করুন।`,
            protectedCount: usersWithOrders.length,
          },
          { status: 400 }
        );
      }

      // Delete cascade for safe users
      await prisma.$transaction([
        prisma.address.deleteMany({ where: { userId: { in: deletableIds } } }),
        prisma.bookmark.deleteMany({ where: { userId: { in: deletableIds } } }),
        prisma.readingProgress.deleteMany({ where: { userId: { in: deletableIds } } }),
        prisma.notification.deleteMany({ where: { userId: { in: deletableIds } } }),
        prisma.user.deleteMany({ where: { id: { in: deletableIds } } }),
        prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            action: 'BULK_DELETE_CUSTOMERS',
            entity: 'USER',
            details: `মোট ${deletableIds.length} জন শূন্য অর্ডারের গ্রাহক মোছা হয়েছে। ${protectedIds.size} জন গ্রাহক অর্ডারের কারণে সুরক্ষিত রাখা হয়েছে।`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `${deletableIds.length} জন গ্রাহক সফলভাবে মুছে ফেলা হয়েছে।${
          protectedIds.size > 0
            ? ` (${protectedIds.size} জন গ্রাহকের অর্ডার থাকায় তাদের ডাটাবেজে অক্ষত রাখা হয়েছে)`
            : ''
        }`,
        deletedCount: deletableIds.length,
        protectedCount: protectedIds.size,
      });
    }

    return NextResponse.json({ error: 'অবৈধ বাল্ক অ্যাকশন।' }, { status: 400 });
  } catch (error: any) {
    console.error('Bulk customer error:', error);
    return NextResponse.json({ error: error.message || 'বাল্ক কার্যক্রম পরিচালনায় সমস্যা হয়েছে।' }, { status: 500 });
  }
}


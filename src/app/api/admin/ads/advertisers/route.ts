import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { invalidateAdsCache } from '@/lib/ads/ad-serving-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const advertisers = await prisma.advertiser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        staffAssignments: {
          include: {
            staff: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            campaigns: true,
            creatives: true,
            invoices: true,
            payments: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, advertisers });
  } catch (err: any) {
    console.error('Error fetching admin advertisers:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপনদাতা তালিকা লোড করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, rejectionReason, internalNotes, staffUserId, staffRole } = body;

    if (!id) {
      return NextResponse.json({ error: 'বিজ্ঞাপনদাতা আইডি আবশ্যক।' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (action === 'VERIFY' || action === 'ACTIVATE') {
      updateData.status = 'ACTIVE';
      updateData.verifiedAt = new Date();
      updateData.rejectionReason = null;
    } else if (action === 'SUSPEND') {
      updateData.status = 'SUSPENDED';
    } else if (action === 'REJECT') {
      updateData.status = 'REJECTED';
      updateData.rejectionReason = rejectionReason || 'যাচাইকরণ ব্যর্থ হয়েছে।';
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    // Handle Staff Assignment
    if (staffUserId) {
      await prisma.adStaffAssignment.upsert({
        where: {
          advertiserId_userId: {
            advertiserId: id,
            userId: staffUserId,
          },
        },
        update: {
          role: staffRole || 'ACCOUNT_MANAGER',
          assignedById: operator.id,
          updatedAt: new Date(),
        },
        create: {
          advertiserId: id,
          userId: staffUserId,
          role: staffRole || 'ACCOUNT_MANAGER',
          assignedById: operator.id,
        },
      });
    }

    const updated = await prisma.advertiser.update({
      where: { id },
      data: updateData,
      include: {
        staffAssignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    // Invalidate serve cache if suspended
    invalidateAdsCache();

    // Audit log
    await prisma.adAuditLog.create({
      data: {
        actorId: operator.id,
        actorName: operator.name,
        actorRole: operator.role,
        action: `ADVERTISER_${action || 'UPDATED'}`,
        entityType: 'ADVERTISER',
        entityId: id,
        details: JSON.stringify({ action, reason: rejectionReason, staffUserId }),
      },
    });

    return NextResponse.json({ success: true, advertiser: updated });
  } catch (err: any) {
    console.error('Error updating advertiser:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপনদাতার তথ্য আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'বিজ্ঞাপনদাতা আইডি আবশ্যক।' }, { status: 400 });
    }

    await prisma.adStaffAssignment.deleteMany({ where: { advertiserId: id } });
    await prisma.advertiser.delete({ where: { id } });

    invalidateAdsCache();

    return NextResponse.json({ success: true, message: 'বিজ্ঞাপনদাতা মুছে ফেলা হয়েছে।' });
  } catch (err: any) {
    console.error('Error deleting advertiser:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপনদাতা ডিলিট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}


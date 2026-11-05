import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'কুপনটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return NextResponse.json({ error: 'কুপন লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'কুপনটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const {
      code,
      discountPct,
      discountAmt,
      minAmount,
      maxUsage,
      expiresAt,
      isActive,
    } = body;

    const updateData: any = {};

    if (code !== undefined) {
      const trimmedCode = code.trim().toUpperCase();
      if (!trimmedCode) {
        return NextResponse.json({ error: 'কুপন কোড খালি রাখা যাবে না।' }, { status: 400 });
      }

      if (trimmedCode !== existing.code) {
        const dup = await prisma.coupon.findUnique({ where: { code: trimmedCode } });
        if (dup) {
          return NextResponse.json({ error: 'এই কোডের কুপন ইতিমধ্যে বিদ্যমান।' }, { status: 400 });
        }
      }
      updateData.code = trimmedCode;
    }

    if (discountPct !== undefined) {
      updateData.discountPct = discountPct !== '' && discountPct !== null ? parseFloat(discountPct) : null;
    }

    if (discountAmt !== undefined) {
      updateData.discountAmt = discountAmt !== '' && discountAmt !== null ? parseFloat(discountAmt) : null;
    }

    if (minAmount !== undefined) {
      updateData.minAmount = minAmount !== '' && minAmount !== null ? parseFloat(minAmount) : null;
    }

    if (maxUsage !== undefined) {
      updateData.maxUsage = maxUsage !== '' && maxUsage !== null ? parseInt(maxUsage, 10) : null;
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updated = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'COUPON_UPDATED',
          entity: 'Coupon',
          entityId: params.id,
          details: JSON.stringify({
            code: updated.code,
            changes: Object.keys(updateData),
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `কুপন "${updated.code}" সফলভাবে হালনাগাদ করা হয়েছে!`,
      coupon: updated,
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'কুপন হালনাগাদ করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'কুপনটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id: params.id },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'COUPON_DELETED',
          entity: 'Coupon',
          entityId: params.id,
          details: JSON.stringify({
            code: existing.code,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `কুপন "${existing.code}" সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'কুপন মুছে ফেলতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, reason, notifyUser = false } = body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'BLOCKED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'অবৈধ স্ট্যাটাস মান দেওয়া হয়েছে।' }, { status: 400 });
    }

    const customer = await prisma.user.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const oldStatus = customer.status || 'ACTIVE';

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: {
        status,
        adminNotes: reason
          ? `${customer.adminNotes ? customer.adminNotes + '\n' : ''}[${new Date().toLocaleDateString('bn-BD')}]: স্ট্যাটাস পরিবর্তন: ${oldStatus} ➔ ${status}. কারণ: ${reason}`
          : customer.adminNotes,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE_CUSTOMER_STATUS',
        entity: 'USER',
        entityId: id,
        details: `স্ট্যাটাস পরিবর্তন: ${oldStatus} ➔ ${status}. কারণ: ${reason || 'কোন কারণ উল্লেখ করা হয়নি'} (অ্যাডমিন: ${adminUser.name})`,
      },
    });

    // Notify user if requested
    if (notifyUser) {
      let title = 'আপনার অ্যাকাউন্ট স্ট্যাটাস আপডেট হয়েছে';
      let message = `আপনার শুভ্বান লাইব্রেরি অ্যাকাউন্টের বর্তমান অবস্থা '${status}' এ পরিবর্তিত হয়েছে।`;
      if (status === 'ACTIVE') {
        title = 'আপনার অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে!';
        message = 'শুভ সংবাদ! আপনার শুভ্বান লাইব্রেরি অ্যাকাউন্টটি এখন পূর্ণ সক্রিয়। আপনি নির্বিঘ্নে বই ও পণ্য অর্ডার করতে পারেন।';
      } else if (status === 'SUSPENDED') {
        title = 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে';
        message = reason ? `অ্যাকাউন্ট স্থগিতের কারণ: ${reason}` : 'নিরাপত্তা বা পলিসি লঙ্ঘনের কারণে অ্যাকাউন্ট সাময়িকভাবে স্থগিত রয়েছে। সহায়তার জন্য যোগাযোগ করুন।';
      } else if (status === 'BLOCKED') {
        title = 'আপনার অ্যাকাউন্ট ব্লক করা হয়েছে';
        message = reason ? `ব্লক করার কারণ: ${reason}` : 'আপনার অ্যাকাউন্টটি প্ল্যাটফর্ম অ্যাডমিন কর্তৃক ব্লক করা হয়েছে।';
      }

      await prisma.notification.create({
        data: {
          userId: id,
          title,
          message,
          type: 'SYSTEM',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `গ্রাহকের স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে।`,
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error('Customer status PATCH error:', error);
    return NextResponse.json({ error: error.message || 'স্ট্যাটাস আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}


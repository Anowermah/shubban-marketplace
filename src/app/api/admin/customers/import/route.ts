import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { rows, defaultPassword = 'CustomerPass@123' } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'আমদানি করার জন্য বৈধ গ্রাহক তালিকা পাওয়া যায়নি।' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'একবারে সর্বোচ্চ ৫০০ জন গ্রাহক আমদানি করা সম্ভব।' }, { status: 400 });
    }

    const defaultHashedPassword = await bcrypt.hash(defaultPassword, 10);
    const results = {
      totalProcessed: rows.length,
      createdCount: 0,
      skippedCount: 0,
      errors: [] as { row: number; email?: string; error: string }[],
    };

    // Pre-fetch all existing customer emails to quickly detect duplicates
    const existingUsers = await prisma.user.findMany({
      select: { email: true },
    });
    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    // Keep track of emails inside the current batch to prevent intra-file duplicates
    const batchEmailSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      const rowNum = i + 1;

      const name = item.name?.trim();
      const rawEmail = item.email?.trim().toLowerCase();
      const phone = item.phone?.trim() || null;
      const status = item.status?.trim().toUpperCase() || 'ACTIVE';
      const customerType = item.customerType?.trim().toUpperCase() || 'INDIVIDUAL';
      const membershipTier = item.membershipTier?.trim().toUpperCase() || 'FREE';
      const city = item.city?.trim() || null;
      const fullAddress = item.fullAddress?.trim() || null;
      const tag = item.tag?.trim() || 'New Customer';

      // Basic validation
      if (!name) {
        results.skippedCount++;
        results.errors.push({ row: rowNum, error: 'নাম প্রদান করা হয়নি।' });
        continue;
      }

      if (!rawEmail || !/^\S+@\S+\.\S+$/.test(rawEmail)) {
        results.skippedCount++;
        results.errors.push({ row: rowNum, email: rawEmail, error: 'অবৈধ বা অনুপস্থিত ইমেইল ঠিকানা।' });
        continue;
      }

      if (batchEmailSet.has(rawEmail)) {
        results.skippedCount++;
        results.errors.push({ row: rowNum, email: rawEmail, error: 'ফাইলে ডুপ্লিকেট ইমেইল ঠিকানা।' });
        continue;
      }

      if (existingEmailSet.has(rawEmail)) {
        results.skippedCount++;
        results.errors.push({ row: rowNum, email: rawEmail, error: 'ডাটাবেজে এই ইমেইলটি ইতিমধ্যে বিদ্যমান।' });
        continue;
      }

      batchEmailSet.add(rawEmail);

      try {
        const usernameBase = rawEmail.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        const username = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;

        await prisma.user.create({
          data: {
            name,
            email: rawEmail,
            phone,
            username,
            passwordHash: defaultHashedPassword,
            role: 'CUSTOMER',
            status,
            customerType,
            membershipTier,
            city,
            fullAddress,
            customerTags: JSON.stringify([tag]),
            isVerified: false,
            country: 'Bangladesh',
          },
        });

        existingEmailSet.add(rawEmail);
        results.createdCount++;
      } catch (err: any) {
        results.skippedCount++;
        results.errors.push({ row: rowNum, email: rawEmail, error: err.message || 'ডাটাবেজ সেভ ব্যর্থ হয়েছে।' });
      }
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'IMPORT_CUSTOMERS',
        entity: 'USER',
        details: `সিএসভি ইম্পোর্ট সম্পন্ন: ${results.createdCount} জন নতুন গ্রাহক তৈরি, ${results.skippedCount} জন বাদ পড়েছে।`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ইম্পোর্ট সম্পন্ন: ${results.createdCount} জন গ্রাহক সফলভাবে তৈরি করা হয়েছে।`,
      results,
    });
  } catch (error: any) {
    console.error('Customer import POST error:', error);
    return NextResponse.json({ error: error.message || 'গ্রাহক আমদানি করতে ব্যর্থ।' }, { status: 500 });
  }
}


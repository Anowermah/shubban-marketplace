import { NextResponse } from 'next/server';
import { getVerifiedSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateMagicBytes } from '@/lib/upload-validator';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_AVATAR_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: Request) {
  let createdFilePath: string | null = null;
  try {
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, { limit: 20, windowMs: 60 * 1000, prefix: 'avatar_up' });
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত আপলোড চেষ্টা। অনুগ্রহ করে ১ মিনিট পর চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'কোনো ছবি নির্বাচন করা হয়নি।' }, { status: 400 });
    }

    // 1. Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: 'ছবির সাইজ সর্বোচ্চ ৪ মেগাবাইট (4MB) হতে পারবে।' },
        { status: 400 }
      );
    }

    // 2. Validate declared MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'শুধুমাত্র JPG, JPEG, PNG এবং WebP ফরম্যাটের ছবি আপলোড করা যাবে।' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 3. Inspect actual binary magic bytes
    const detectedType = validateMagicBytes(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType)) {
      return NextResponse.json(
        { error: 'অবাস্তব বা বিকৃত ফাইল। অনুগ্রহ করে একটি আসল ইমেজ ফাইল নির্বাচন করুন।' },
        { status: 400 }
      );
    }

    // Extension from detected binary type
    const ext = detectedType === 'image/jpeg' ? '.jpg' : detectedType === 'image/png' ? '.png' : '.webp';
    const safeFileName = `avatar_${session.id}_${Date.now()}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });

    // Fetch current user to inspect existing local avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

    // 4. Write new avatar file to disk first
    const filePath = path.join(uploadDir, safeFileName);
    createdFilePath = filePath;
    await fs.writeFile(filePath, Buffer.from(buffer));

    const publicAvatarUrl = `/uploads/avatars/${safeFileName}`;

    // 5. Persist to database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { avatarUrl: publicAvatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // 6. Safely clean up previous local avatar file AFTER database update succeeds
    if (
      currentUser?.avatarUrl &&
      currentUser.avatarUrl.startsWith('/uploads/avatars/') &&
      currentUser.avatarUrl !== publicAvatarUrl
    ) {
      try {
        const oldFile = path.join(process.cwd(), 'public', currentUser.avatarUrl.replace(/^\//, ''));
        await fs.unlink(oldFile).catch(() => {});
      } catch (e) {
        // ignore unlink error
      }
    }

    // 7. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'AVATAR_UPLOADED',
          entity: 'User',
          entityId: session.id,
          ipAddress: clientIp,
          details: JSON.stringify({ avatarUrl: publicAvatarUrl, fileSize: file.size }),
        },
      });
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'প্রোফাইল ছবি সফলভাবে আপলোড করা হয়েছে!',
      avatarUrl: publicAvatarUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    // Cleanup newly written file if database or post-processing failed
    if (createdFilePath) {
      await fs.unlink(createdFilePath).catch(() => {});
    }
    return NextResponse.json({ error: 'প্রোফাইল ছবি সংরক্ষণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

    const oldAvatarUrl = currentUser?.avatarUrl;

    // 1. Update database first
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // 2. Unlink old file from disk if it was a local uploaded avatar
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      try {
        const oldFile = path.join(process.cwd(), 'public', oldAvatarUrl.replace(/^\//, ''));
        await fs.unlink(oldFile).catch(() => {});
      } catch (e) {
        // ignore unlink error
      }
    }

    // 3. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'AVATAR_REMOVED',
          entity: 'User',
          entityId: session.id,
          ipAddress: clientIp,
          details: JSON.stringify({ oldAvatarUrl }),
        },
      });
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'প্রোফাইল ছবি সফলভাবে মুছে ফেলা হয়েছে।',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Avatar remove error:', error);
    return NextResponse.json({ error: 'প্রোফাইল ছবি মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { validateUploadFile } from '@/lib/upload-validator';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check: 20 uploads per minute per IP
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, { limit: 20, windowMs: 60 * 1000, prefix: 'upload' });
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত ফাইল আপলোডের অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    // 2. Authentication check: Only registered users can upload
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'ফাইল আপলোড করার জন্য লগইন করা আবশ্যক।' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'কোনো ফাইল নির্বাচন করা হয়নি।' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 3. Strict security validation (MIME, Magic Bytes, Max Size, Path Traversal Sanitization)
    const validation = validateUploadFile(
      { name: file.name, size: file.size, type: file.type },
      buffer
    );

    if (!validation.valid || !validation.sanitizedName) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 4. Save to public uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, validation.sanitizedName);
    await fs.writeFile(filePath, Buffer.from(buffer));

    const publicUrl = `/uploads/${validation.sanitizedName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: validation.sanitizedName,
      type: validation.detectedType,
      size: file.size,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'ফাইল প্রক্রিয়াকরণে ব্যর্থতা।' }, { status: 500 });
  }
}


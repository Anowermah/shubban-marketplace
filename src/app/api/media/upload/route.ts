import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { mediaService } from '@/lib/media/media-service';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check: 40 uploads per minute per IP
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, { limit: 40, windowMs: 60 * 1000, prefix: 'media_up' });
    if (!limitCheck.success) {
      return NextResponse.json(
        { success: false, error: 'অতিরিক্ত ফাইল আপলোডের অনুরোধ। কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    // 2. Authentication & Authorization check
    const user = await getVerifiedSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'মিডিয়া আপলোড করার জন্য লগইন করা আবশ্যক।' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const filesToUpload: File[] = [];
    if (files && files.length > 0) {
      filesToUpload.push(...files);
    } else if (singleFile) {
      filesToUpload.push(singleFile);
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'কোনো ফাইল নির্বাচন করা হয়নি।' },
        { status: 400 }
      );
    }

    const folderId = (formData.get('folderId') as string) || undefined;
    const visibility = (formData.get('visibility') as 'PUBLIC' | 'PRIVATE' | 'RESTRICTED') || 'PUBLIC';
    const altText = (formData.get('altText') as string) || undefined;
    const caption = (formData.get('caption') as string) || undefined;
    const description = (formData.get('description') as string) || undefined;
    const rawTags = (formData.get('tags') as string) || '';
    const tags = rawTags
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const results: any[] = [];
    const errors: string[] = [];

    // Process each file
    for (const file of filesToUpload) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await mediaService.uploadAsset({
          filename: file.name,
          buffer,
          declaredType: file.type,
          title: file.name,
          altText,
          caption,
          description,
          folderId,
          visibility,
          uploadedBy: user.name || user.email || 'Admin',
          tags,
          checkDuplicate: true,
        });

        results.push(uploadResult);
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join('; ') },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `মোট ${results.length}টি ফাইল সফলভাবে আপলোড হয়েছে।`,
      assets: results.map((r) => r.asset),
      duplicates: results.filter((r) => r.isDuplicate).map((r) => r.asset),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Media upload API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'মিডিয়া ফাইল আপলোডে অপ্রত্যাশিত ত্রুটি ঘটেছে।' },
      { status: 500 }
    );
  }
}


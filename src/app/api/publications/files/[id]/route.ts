import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const file = await prisma.publicationFile.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json({ success: false, error: 'ফাইল পাওয়া যায়নি' }, { status: 404 });
    }

    // Check if linked to any issue
    const issueCount = await prisma.publicationIssue.count({ where: { pdfUrl: file.fileUrl } });

    if (issueCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `এই ফাইলটি ${issueCount}টি পত্রিকায় ব্যবহৃত হচ্ছে। ডিলিট করার আগে লিংক মুছে ফেলুন।`,
        },
        { status: 400 }
      );
    }

    // Try deleting from local disk if stored locally
    if (file.storageType === 'LOCAL' && file.fileUrl.startsWith('/uploads/publications/')) {
      try {
        const diskPath = path.join(process.cwd(), 'public', file.fileUrl.replace(/^\//, ''));
        await unlink(diskPath);
      } catch (err) {
        console.warn('Could not delete file from disk:', err);
      }
    }

    await prisma.publicationFile.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ফাইল সফলভাবে মুছে ফেলা হয়েছে',
    });
  } catch (error: any) {
    console.error('Error deleting publication file:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete publication file' },
      { status: 500 }
    );
  }
}

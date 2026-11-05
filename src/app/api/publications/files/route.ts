import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { title: { contains: search } },
      ];
    }

    const [files, total] = await Promise.all([
      prisma.publicationFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.publicationFile.count({ where }),
    ]);

    // Check usage across issues for each file
    const fileUrls = files.map((f) => f.fileUrl);
    const linkedIssues = await prisma.publicationIssue.findMany({
      where: { pdfUrl: { in: fileUrls } },
      select: { id: true, issueTitle: true, pdfUrl: true },
    });

    const enrichedFiles = files.map((file) => {
      const issues = linkedIssues.filter((i) => i.pdfUrl === file.fileUrl);
      return {
        ...file,
        usageCount: issues.length,
        linkedItems: issues.map((i) => ({ type: 'issue', id: i.id, title: i.issueTitle })),
      };
    });

    return NextResponse.json({
      success: true,
      files: enrichedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error listing publication files:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list publication files' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Handling multipart form file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const title = (formData.get('title') as string) || '';
      const isRestricted = formData.get('isRestricted') === 'true';

      if (!file) {
        return NextResponse.json({ success: false, error: 'কোনো ফাইল সিলেক্ট করা হয়নি' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Checksum calculation (SHA-256)
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      // Unique file name to prevent collision
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}-${sanitizedName}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'publications');
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFileName);
      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/publications/${uniqueFileName}`;
      const fileSizeBytes = buffer.length;
      const fileSize = formatBytes(fileSizeBytes);

      const publicationFile = await prisma.publicationFile.create({
        data: {
          fileName: file.name,
          fileUrl,
          fileSize,
          fileSizeBytes,
          mimeType: file.type || 'application/pdf',
          title: title || file.name,
          storageType: 'LOCAL',
          isRestricted,
          checksum,
          uploadedBy: user.name || user.email || 'Admin',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'ফাইল সফলভাবে আপলোড হয়েছে',
        file: publicationFile,
      });
    }

    // JSON payload for registering remote URL
    const body = await req.json();
    const { fileName, fileUrl, title, fileSize, pageCount, isRestricted } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'ফাইল নাম এবং URL আবশ্যক' },
        { status: 400 }
      );
    }

    const publicationFile = await prisma.publicationFile.create({
      data: {
        fileName,
        fileUrl,
        title: title || fileName,
        fileSize: fileSize || 'Unknown',
        pageCount: pageCount || 0,
        isRestricted: !!isRestricted,
        uploadedBy: user.name || user.email || 'Admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ফাইল সফলভাবে সংরক্ষিত হয়েছে',
      file: publicationFile,
    });
  } catch (error: any) {
    console.error('Error saving publication file:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save publication file' },
      { status: 500 }
    );
  }
}

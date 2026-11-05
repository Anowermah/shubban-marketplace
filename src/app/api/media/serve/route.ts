import { NextRequest, NextResponse } from 'next/server';
import { storageAdapter } from '@/lib/media/storage-adapter';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import { existsSync, statSync, createReadStream } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const expires = parseInt(searchParams.get('expires') || '0', 10);
    const sig = searchParams.get('sig') || '';

    if (!key) {
      return new NextResponse('Bad Request: Missing media key', { status: 400 });
    }

    // 1. Check if user is logged in as Admin / Staff (can bypass signed URL)
    let isAuthorized = false;
    const session = await getVerifiedSessionUser().catch(() => null);
    if (session && (isAdmin(session.role) || isStaff(session.role))) {
      isAuthorized = true;
    }

    // 2. If not admin, verify signed token
    if (!isAuthorized) {
      if (!expires || !sig) {
        return new NextResponse('Unauthorized: Access token required for restricted media', { status: 401 });
      }

      const isValidSignature = (storageAdapter as any).verifySignedUrl(key, expires, sig);
      if (!isValidSignature) {
        return new NextResponse('Forbidden: Invalid or expired media access link', { status: 403 });
      }
    }

    // 3. Resolve file location (Checks Private storage first, then Public media upload dir)
    const privateRoot = path.join(process.cwd(), 'storage', 'private');
    const publicRoot = path.join(process.cwd(), 'public', 'uploads', 'media');
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');

    let fullPath = path.join(privateRoot, safeKey);
    if (!existsSync(fullPath)) {
      fullPath = path.join(publicRoot, safeKey);
    }

    if (!existsSync(fullPath)) {
      return new NextResponse('Not Found: Media file not found', { status: 404 });
    }

    const stat = statSync(fullPath);
    const fileSize = stat.size;

    // Resolve mime type from DB or extension
    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    // 4. Handle HTTP Range Request (Streaming audio/video or large PDFs)
    const range = req.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileBuffer = await fs.readFile(fullPath);
      const partialBuffer = fileBuffer.slice(start, end + 1);

      return new NextResponse(partialBuffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    }

    // 5. Standard Full Response
    const buffer = await fs.readFile(fullPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
      },
    });
  } catch (err: any) {
    console.error('Media serve error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


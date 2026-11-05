import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resource = await prisma.islamicResource.findUnique({
      where: { id: params.id },
    });

    if (!resource) {
      return NextResponse.json({ error: 'রিসোর্স পাওয়া যায়নি।' }, { status: 404 });
    }

    const updated = await prisma.islamicResource.update({
      where: { id: params.id },
      data: {
        downloads: { increment: 1 },
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        downloads: true,
      },
    });

    return NextResponse.json({
      success: true,
      downloads: updated.downloads,
      fileUrl: updated.fileUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { user: { name: { contains: search } } },
        { article: { title: { contains: search } } },
      ];
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          article: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching publication feedback:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isApproved } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID আবশ্যক' }, { status: 400 });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        isApproved: Boolean(isApproved),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'কমেন্ট স্ট্যাটাস আপডেট হয়েছে',
      comment,
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID আবশ্যক' }, { status: 400 });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'কমেন্ট মুছে ফেলা হয়েছে',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

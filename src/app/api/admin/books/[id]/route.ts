import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { stockQuantity, isFeatured } = await req.json();

    const book = await prisma.book.update({
      where: { id: params.id },
      data: {
        ...(stockQuantity !== undefined ? { stockQuantity: Number(stockQuantity) } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error) {
    return NextResponse.json({ error: 'বই আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}


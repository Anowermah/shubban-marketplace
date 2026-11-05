import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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
    await prisma.publicationTag.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ট্যাগ মুছে ফেলা হয়েছে',
    });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete tag' },
      { status: 500 }
    );
  }
}

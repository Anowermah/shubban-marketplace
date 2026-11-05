import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const dataToUpdate: any = {};
    if (typeof body.badge === 'string') dataToUpdate.badge = body.badge.trim();
    if (typeof body.badgeIcon === 'string') dataToUpdate.badgeIcon = body.badgeIcon;
    if (typeof body.headline === 'string') dataToUpdate.headline = body.headline.trim();
    if (typeof body.subhead === 'string') dataToUpdate.subhead = body.subhead.trim();
    if (body.couponCode !== undefined) dataToUpdate.couponCode = body.couponCode ? body.couponCode.trim().toUpperCase() : null;
    if (typeof body.primaryCtaText === 'string') dataToUpdate.primaryCtaText = body.primaryCtaText.trim();
    if (typeof body.primaryCtaLink === 'string') dataToUpdate.primaryCtaLink = body.primaryCtaLink.trim();
    if (body.secondaryCtaText !== undefined) dataToUpdate.secondaryCtaText = body.secondaryCtaText ? body.secondaryCtaText.trim() : null;
    if (body.secondaryCtaLink !== undefined) dataToUpdate.secondaryCtaLink = body.secondaryCtaLink ? body.secondaryCtaLink.trim() : null;
    if (typeof body.bgGradient === 'string') dataToUpdate.bgGradient = body.bgGradient;
    if (typeof body.imageUrl === 'string') dataToUpdate.imageUrl = body.imageUrl.trim();
    if (typeof body.isPublished === 'boolean') dataToUpdate.isPublished = body.isPublished;
    if (typeof body.displayOrder === 'number') dataToUpdate.displayOrder = body.displayOrder;

    const updated = await prisma.heroSlide.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath('/');
    return NextResponse.json({ slide: updated, message: 'ব্যানার স্লাইডার সফলভাবে হালনাগাদ করা হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { id } = params;
    await prisma.heroSlide.delete({ where: { id } });

    revalidatePath('/');
    return NextResponse.json({ message: 'ব্যানার স্লাইডার মুছে ফেলা হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


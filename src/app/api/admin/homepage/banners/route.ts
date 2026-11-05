import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// GET all hero slides
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const slides = await prisma.heroSlide.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ slides });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create hero slide
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const {
      badge,
      badgeIcon,
      headline,
      subhead,
      couponCode,
      primaryCtaText,
      primaryCtaLink,
      secondaryCtaText,
      secondaryCtaLink,
      bgGradient,
      imageUrl,
      isPublished,
    } = body;

    if (!badge || !headline || !imageUrl) {
      return NextResponse.json({ error: 'ব্যাজ, হেডলাইন ও ছবির লিংক আবশ্যক' }, { status: 400 });
    }

    const highest = await prisma.heroSlide.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = (highest?.displayOrder || 0) + 1;

    const slide = await prisma.heroSlide.create({
      data: {
        badge: badge.trim(),
        badgeIcon: badgeIcon || 'Flame',
        headline: headline.trim(),
        subhead: subhead?.trim() || '',
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        primaryCtaText: primaryCtaText?.trim() || 'সকল বই দেখুন',
        primaryCtaLink: primaryCtaLink?.trim() || '/books',
        secondaryCtaText: secondaryCtaText?.trim() || null,
        secondaryCtaLink: secondaryCtaLink?.trim() || null,
        bgGradient: bgGradient || 'from-shubban-green via-emerald-950 to-shubban-green',
        imageUrl: imageUrl.trim(),
        displayOrder: nextOrder,
        isPublished: isPublished !== false,
      },
    });

    revalidatePath('/');
    return NextResponse.json({ slide, message: 'ব্যানার স্লাইডার সফলভাবে তৈরি হয়েছে' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT bulk reorder slides
export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { orders } = body; // Array of { id: string, displayOrder: number }

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: 'অর্ডার তালিকা সঠিক নয়' }, { status: 400 });
    }

    await prisma.$transaction(
      orders.map((item) =>
        prisma.heroSlide.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    revalidatePath('/');
    return NextResponse.json({ message: 'স্লাইডার ক্রমানুসার সফলভাবে সংরক্ষিত হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


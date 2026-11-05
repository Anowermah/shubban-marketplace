import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// GET all homepage sections ordered by displayOrder
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const sections = await prisma.homepageSection.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ sections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a custom homepage section
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { sectionKey, title, subtitle, badge, viewAllUrl, isEnabled, config } = body;

    if (!sectionKey || !title) {
      return NextResponse.json({ error: 'সেকশন কী ও শিরোনাম আবশ্যক' }, { status: 400 });
    }

    const highest = await prisma.homepageSection.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = (highest?.displayOrder || 0) + 1;

    const section = await prisma.homepageSection.create({
      data: {
        sectionKey: sectionKey.trim().toLowerCase().replace(/\s+/g, '_'),
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        badge: badge?.trim() || null,
        viewAllUrl: viewAllUrl?.trim() || null,
        isEnabled: isEnabled !== false,
        displayOrder: nextOrder,
        config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null,
      },
    });

    revalidatePath('/');
    return NextResponse.json({ section, message: 'সেকশন সফলভাবে তৈরি হয়েছে' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'এই সেকশন কী ইতিমধ্যে বিদ্যমান' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Bulk reorder sections
export async function PUT(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { orders } = body; // Array of { id: string, displayOrder: number, isEnabled?: boolean }

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: 'অর্ডার তালিকা সঠিক নয়' }, { status: 400 });
    }

    await prisma.$transaction(
      orders.map((item) =>
        prisma.homepageSection.update({
          where: { id: item.id },
          data: {
            displayOrder: item.displayOrder,
            ...(typeof item.isEnabled === 'boolean' ? { isEnabled: item.isEnabled } : {}),
          },
        })
      )
    );

    revalidatePath('/');
    return NextResponse.json({ message: 'সেকশন ক্রমানুসার সফলভাবে হালনাগাদ হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


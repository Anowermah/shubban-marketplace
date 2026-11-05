import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const groups = await prisma.productAttributeGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        attributes: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            status: true,
          },
        },
        _count: {
          select: { attributes: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error: any) {
    console.error('Admin Attribute Groups GET error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউট গ্রুপ লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, description, displayOrder = 0, status = 'ACTIVE' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'গ্রুপের নাম আবশ্যক।' }, { status: 400 });
    }

    const groupSlug = (slug?.trim() || generateSlug(name.trim())) || `group-${Date.now()}`;

    const existing = await prisma.productAttributeGroup.findUnique({
      where: { slug: groupSlug },
    });

    if (existing) {
      return NextResponse.json({ error: 'এই স্লাগ দ্বারা ইতিমধ্যে একটি গ্রুপ বিদ্যমান।' }, { status: 400 });
    }

    const newGroup = await prisma.productAttributeGroup.create({
      data: {
        name: name.trim(),
        slug: groupSlug,
        description: description?.trim() || null,
        displayOrder: parseInt(String(displayOrder), 10) || 0,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'অ্যাট্রিবিউট গ্রুপ সফলভাবে তৈরি হয়েছে!',
      group: newGroup,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Attribute Groups POST error:', error);
    return NextResponse.json({ error: error.message || 'গ্রুপ তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, slug, description, displayOrder, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'গ্রুপ আইডি প্রদান করুন।' }, { status: 400 });
    }

    const existing = await prisma.productAttributeGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'গ্রুপটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug.trim() || generateSlug(name || existing.name);
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(String(displayOrder), 10) || 0;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.productAttributeGroup.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'গ্রুপ সফলভাবে আপডেট করা হয়েছে!',
      group: updated,
    });
  } catch (error: any) {
    console.error('Admin Attribute Groups PUT error:', error);
    return NextResponse.json({ error: error.message || 'গ্রুপ আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'গ্রুপ আইডি প্রদান করুন।' }, { status: 400 });
    }

    // Safe deletion: attributes will have groupId set to null
    await prisma.productAttributeGroup.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'অ্যাট্রিবিউট গ্রুপ সফলভাবে মুছে ফেলা হয়েছে!',
    });
  } catch (error: any) {
    console.error('Admin Attribute Groups DELETE error:', error);
    return NextResponse.json({ error: error.message || 'গ্রুপ মুছতে ব্যর্থ।' }, { status: 500 });
  }
}


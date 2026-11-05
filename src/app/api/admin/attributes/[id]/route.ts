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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: {
        group: true,
        values: {
          orderBy: { displayOrder: 'asc' },
        },
        assignments: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                price: true,
              },
            },
            values: {
              include: {
                value: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
            values: true,
          },
        },
      },
    });

    if (!attribute) {
      return NextResponse.json({ error: 'অ্যাট্রিবিউটটি পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      attribute,
    });
  } catch (error: any) {
    console.error('Admin Attribute GET error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউটের বিবরণ পেতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      code,
      description,
      type,
      displayLabel,
      displayOrder,
      status,
      isRequired,
      isVariant,
      showOnProduct,
      useInFilter,
      groupId,
    } = body;

    const existing = await prisma.productAttribute.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'অ্যাট্রিবিউটটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // Uniqueness validation on update
    if (code && code.trim() !== existing.code) {
      const duplicateCode = await prisma.productAttribute.findFirst({
        where: { code: code.trim(), id: { not: params.id } },
      });
      if (duplicateCode) {
        return NextResponse.json({ error: `এই কোড (${code.trim()}) অন্য একটি অ্যাট্রিবিউটে ব্যবহৃত হচ্ছে।` }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug.trim() || generateSlug(name || existing.name);
    if (code !== undefined) updateData.code = code.trim().toUpperCase().replace(/-/g, '_');
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (type !== undefined) updateData.type = type;
    if (displayLabel !== undefined) updateData.displayLabel = displayLabel?.trim() || null;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(String(displayOrder), 10) || 0;
    if (status !== undefined) updateData.status = status;
    if (isRequired !== undefined) updateData.isRequired = Boolean(isRequired);
    if (isVariant !== undefined) updateData.isVariant = Boolean(isVariant);
    if (showOnProduct !== undefined) updateData.showOnProduct = Boolean(showOnProduct);
    if (useInFilter !== undefined) updateData.useInFilter = Boolean(useInFilter);
    if (groupId !== undefined) updateData.groupId = groupId || null;

    const updated = await prisma.productAttribute.update({
      where: { id: params.id },
      data: updateData,
      include: {
        group: true,
        values: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { assignments: true, values: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'অ্যাট্রিবিউট সফলভাবে আপডেট করা হয়েছে!',
      attribute: updated,
    });
  } catch (error: any) {
    console.error('Admin Attribute PUT error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউট আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const existing = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { assignments: true, values: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'অ্যাট্রিবিউটটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // Cascade delete values and product assignments safely
    await prisma.productAttribute.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `অ্যাট্রিবিউট '${existing.name}' সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error('Admin Attribute DELETE error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউট মুছতে ব্যর্থ।' }, { status: 500 });
  }
}


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

    const values = await prisma.productAttributeValue.findMany({
      where: { attributeId: params.id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      values,
    });
  } catch (error: any) {
    console.error('Admin Attribute Values GET error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউট ভ্যালু লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(
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
    });

    if (!attribute) {
      return NextResponse.json({ error: 'অ্যাট্রিবিউটটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();

    // Check if bulk add: { bulkNames: string[] } or comma/newline separated string
    if (body.bulkText) {
      const names = body.bulkText
        .split(/[\n,]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      if (names.length === 0) {
        return NextResponse.json({ error: 'অন্তত একটি ভ্যালু নাম লিখুন।' }, { status: 400 });
      }

      const existingValues = await prisma.productAttributeValue.findMany({
        where: { attributeId: params.id },
      });
      const existingNames = new Set(existingValues.map((v) => v.name.toLowerCase()));
      let currentMaxOrder = existingValues.reduce((max, v) => Math.max(max, v.displayOrder), 0);

      const toCreate = [];
      for (const name of names) {
        if (!existingNames.has(name.toLowerCase())) {
          existingNames.add(name.toLowerCase());
          currentMaxOrder++;
          toCreate.push({
            attributeId: params.id,
            name,
            slug: generateSlug(name) || `val-${Date.now()}-${currentMaxOrder}`,
            code: name.toUpperCase().replace(/\s+/g, '_').slice(0, 20),
            displayOrder: currentMaxOrder,
            status: 'ACTIVE',
          });
        }
      }

      if (toCreate.length === 0) {
        return NextResponse.json({ error: 'প্রদত্ত সকল ভ্যালু ইতিমধ্যে বিদ্যমান।' }, { status: 400 });
      }

      await prisma.productAttributeValue.createMany({
        data: toCreate,
      });

      const updatedValues = await prisma.productAttributeValue.findMany({
        where: { attributeId: params.id },
        orderBy: { displayOrder: 'asc' },
      });

      return NextResponse.json({
        success: true,
        message: `${toCreate.length}টি ভ্যালু সফলভাবে যোগ করা হয়েছে!`,
        values: updatedValues,
      }, { status: 201 });
    }

    // Single value creation
    const { name, slug, code, colorHex, swatchImage, displayOrder, status = 'ACTIVE', metadata } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'ভ্যালুর নাম আবশ্যক।' }, { status: 400 });
    }

    const valName = name.trim();
    const valSlug = (slug?.trim() || generateSlug(valName)) || `val-${Date.now()}`;

    // Duplicate check within attribute
    const existingVal = await prisma.productAttributeValue.findFirst({
      where: {
        attributeId: params.id,
        OR: [{ name: valName }, { slug: valSlug }],
      },
    });

    if (existingVal) {
      return NextResponse.json(
        { error: `এই অ্যাট্রিবিউটে '${valName}' ভ্যালুটি ইতিমধ্যে বিদ্যমান রয়েছে।` },
        { status: 400 }
      );
    }

    let order = typeof displayOrder === 'number' ? displayOrder : 0;
    if (!order) {
      const maxOrder = await prisma.productAttributeValue.aggregate({
        where: { attributeId: params.id },
        _max: { displayOrder: true },
      });
      order = (maxOrder._max.displayOrder || 0) + 1;
    }

    const newValue = await prisma.productAttributeValue.create({
      data: {
        attributeId: params.id,
        name: valName,
        slug: valSlug,
        code: code?.trim() || null,
        colorHex: colorHex?.trim() || null,
        swatchImage: swatchImage?.trim() || null,
        displayOrder: order,
        status,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ভ্যালু সফলভাবে যোগ করা হয়েছে!',
      value: newValue,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Attribute Values POST error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যালু যোগ করতে ব্যর্থ।' }, { status: 500 });
  }
}

// Reorder values
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { items } = await req.json(); // Array of { id: string, displayOrder: number }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'অবৈধ রিঅর্ডারিং ডেটা।' }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.productAttributeValue.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    const values = await prisma.productAttributeValue.findMany({
      where: { attributeId: params.id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'ভ্যালুর ক্রম সফলভাবে আপডেট হয়েছে!',
      values,
    });
  } catch (error: any) {
    console.error('Admin Attribute Values PUT error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যালু রিঅর্ডার করতে ব্যর্থ।' }, { status: 500 });
  }
}

// Update single value
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { valueId, name, slug, code, colorHex, swatchImage, status, displayOrder, metadata } = body;

    if (!valueId) {
      return NextResponse.json({ error: 'ভ্যালু আইডি আবশ্যক।' }, { status: 400 });
    }

    const existing = await prisma.productAttributeValue.findUnique({
      where: { id: valueId },
    });

    if (!existing || existing.attributeId !== params.id) {
      return NextResponse.json({ error: 'ভ্যালুটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug.trim() || generateSlug(name || existing.name);
    if (code !== undefined) updateData.code = code?.trim() || null;
    if (colorHex !== undefined) updateData.colorHex = colorHex?.trim() || null;
    if (swatchImage !== undefined) updateData.swatchImage = swatchImage?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(String(displayOrder), 10) || 0;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;

    const updated = await prisma.productAttributeValue.update({
      where: { id: valueId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'ভ্যালু সফলভাবে আপডেট করা হয়েছে!',
      value: updated,
    });
  } catch (error: any) {
    console.error('Admin Attribute Values PATCH error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যালু আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

// Delete single value
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const valueId = searchParams.get('valueId');

    if (!valueId) {
      return NextResponse.json({ error: 'ভ্যালু আইডি প্রদান করুন।' }, { status: 400 });
    }

    const existing = await prisma.productAttributeValue.findUnique({
      where: { id: valueId },
    });

    if (!existing || existing.attributeId !== params.id) {
      return NextResponse.json({ error: 'ভ্যালুটি পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.productAttributeValue.delete({
      where: { id: valueId },
    });

    return NextResponse.json({
      success: true,
      message: `'${existing.name}' ভ্যালুটি সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error('Admin Attribute Values DELETE error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যালু মুছতে ব্যর্থ।' }, { status: 500 });
  }
}


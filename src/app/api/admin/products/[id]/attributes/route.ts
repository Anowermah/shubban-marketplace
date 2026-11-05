import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        titleEn: true,
        slug: true,
        coverImage: true,
        price: true,
        discountPrice: true,
        stockQuantity: true,
        attributeAssignments: {
          orderBy: { displayOrder: 'asc' },
          include: {
            attribute: {
              include: {
                group: true,
                values: { orderBy: { displayOrder: 'asc' } },
              },
            },
            values: {
              include: { value: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // Also get all available active attributes for selector
    const allAttributes = await prisma.productAttribute.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
      include: {
        group: true,
        values: {
          where: { status: 'ACTIVE' },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      product,
      allAttributes,
    });
  } catch (error: any) {
    console.error('Product Attributes GET error:', error);
    return NextResponse.json({ error: error.message || 'পণ্যের অ্যাট্রিবিউট পেতে ব্যর্থ।' }, { status: 500 });
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

    const product = await prisma.book.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const { assignments = [] } = body; // Array of { attributeId, isRequired, isVariant, defaultValue, displayOrder, valueIds: string[] }

    // Execute in transaction to safely synchronize product attributes
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing assignments
      await tx.productAttributeAssignment.deleteMany({
        where: { bookId: params.id },
      });

      // 2. Re-create specified assignments
      for (let i = 0; i < assignments.length; i++) {
        const item = assignments[i];
        if (!item.attributeId) continue;

        const assignment = await tx.productAttributeAssignment.create({
          data: {
            bookId: params.id,
            attributeId: item.attributeId,
            isRequired: Boolean(item.isRequired),
            isVariant: Boolean(item.isVariant), // SPECIFICATION vs VARIANT GENERATOR FLAG
            defaultValue: item.defaultValue?.trim() || null,
            displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : i + 1,
          },
        });

        // Add selected values
        if (Array.isArray(item.valueIds) && item.valueIds.length > 0) {
          const valueLinks = item.valueIds.map((valId: string) => ({
            assignmentId: assignment.id,
            valueId: valId,
          }));

          await tx.productAttributeAssignmentValue.createMany({
            data: valueLinks,
          });
        }
      }
    });

    // Fetch refreshed assignments
    const updatedAssignments = await prisma.productAttributeAssignment.findMany({
      where: { bookId: params.id },
      orderBy: { displayOrder: 'asc' },
      include: {
        attribute: {
          include: {
            group: true,
            values: { orderBy: { displayOrder: 'asc' } },
          },
        },
        values: {
          include: { value: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্যের অ্যাট্রিবিউট সফলভাবে সেভ করা হয়েছে!',
      assignments: updatedAssignments,
    });
  } catch (error: any) {
    console.error('Product Attributes POST error:', error);
    return NextResponse.json({ error: error.message || 'পণ্যের অ্যাট্রিবিউট সেভ করতে ব্যর্থ।' }, { status: 500 });
  }
}


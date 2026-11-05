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

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Get parent category info if exists
    let parent = null;
    if (category.parentId) {
      parent = await prisma.category.findUnique({
        where: { id: category.parentId },
        select: { id: true, name: true, nameEn: true, slug: true },
      });
    }

    // Get child subcategories
    const subcategories = await prisma.category.findMany({
      where: { parentId: category.id },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      category: {
        ...category,
        parent,
        subcategories,
        subcategoryCount: subcategories.length,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/categories/[id]:', error);
    return NextResponse.json(
      { error: 'ক্যাটাগরির বিবরণ লোড করতে ব্যর্থ হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'ক্যাটাগরির নাম খালি রাখা যাবে না।' }, { status: 400 });
      }
      updateData.name = trimmed;
    }

    if (body.nameEn !== undefined) {
      updateData.nameEn = body.nameEn ? String(body.nameEn).trim() : null;
    }

    if (body.slug !== undefined) {
      const slugVal = generateSlug(String(body.slug));
      if (!slugVal) {
        return NextResponse.json({ error: 'কার্যকর স্লাগ প্রদান করুন।' }, { status: 400 });
      }
      // Check slug uniqueness among other categories
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug: slugVal,
          id: { not: params.id },
        },
      });
      if (slugConflict) {
        return NextResponse.json({ error: 'এই স্লাগটি ইতোমধ্যে অন্য একটি ক্যাটাগরিতে ব্যবহৃত হয়েছে।' }, { status: 400 });
      }
      updateData.slug = slugVal;
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }

    if (body.icon !== undefined) {
      updateData.icon = body.icon ? String(body.icon).trim() : null;
    }

    if (body.image !== undefined) {
      updateData.image = body.image ? String(body.image).trim() : null;
    }

    if (body.type !== undefined) {
      updateData.type = String(body.type);
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.displayOrder !== undefined) {
      updateData.displayOrder = Number(body.displayOrder) || 0;
    }

    if (body.seoTitle !== undefined) {
      updateData.seoTitle = body.seoTitle ? String(body.seoTitle).trim() : null;
    }

    if (body.seoDescription !== undefined) {
      updateData.seoDescription = body.seoDescription ? String(body.seoDescription).trim() : null;
    }

    // Hierarchy cycle and parent check
    if (body.parentId !== undefined) {
      const newParentId = body.parentId ? String(body.parentId).trim() : null;

      if (newParentId === params.id) {
        return NextResponse.json({ error: 'ক্যাটাগরি নিজেই নিজের মূল ক্যাটাগরি হতে পারে না।' }, { status: 400 });
      }

      if (newParentId) {
        // Verify parent exists
        const parentExists = await prisma.category.findUnique({
          where: { id: newParentId },
        });
        if (!parentExists) {
          return NextResponse.json({ error: 'নির্বাচিত মূল ক্যাটাগরি খুঁজে পাওয়া যায়নি।' }, { status: 400 });
        }

        // Prevent cycle: newParentId cannot be one of existingCategory's children
        const isChild = await prisma.category.findFirst({
          where: { id: newParentId, parentId: params.id },
        });
        if (isChild) {
          return NextResponse.json({ error: 'উপ-বিভাগকে মূল ক্যাটাগরি হিসেবে নির্ধারণ করা যাবে না।' }, { status: 400 });
        }
      }

      updateData.parentId = newParentId;
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_CATEGORY',
          entity: 'Category',
          entityId: updated.id,
          details: JSON.stringify({
            updatedFields: Object.keys(updateData),
            name: updated.name,
            isActive: updated.isActive,
            displayOrder: updated.displayOrder,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      category: updated,
      message: 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/categories/[id]:', error);
    return NextResponse.json(
      { error: 'ক্যাটাগরি আপডেট করতে ব্যর্থ হয়েছে।', details: error.message },
      { status: 500 }
    );
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

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Safety Check 1: Subcategories
    const subcategoryCount = await prisma.category.count({
      where: { parentId: params.id },
    });

    if (subcategoryCount > 0) {
      return NextResponse.json(
        {
          error: `এই ক্যাটাগরিতে ${subcategoryCount}টি উপ-বিভাগ রয়েছে। প্রথমে উপ-বিভাগগুলো অন্য ক্যাটাগরিতে স্থানান্তর করুন অথবা ডিলিট করুন।`,
        },
        { status: 400 }
      );
    }

    // Safety Check 2: Linked books / articles / magazines / questions
    const totalItems =
      category._count.books +
      category._count.articles +
      category._count.magazines +
      category._count.questions;

    if (totalItems > 0) {
      return NextResponse.json(
        {
          error: `এই ক্যাটাগরির অধীনে মোট ${totalItems}টি আইটেম (${category._count.books}টি বই) যুক্ত রয়েছে। সংশ্লিষ্ট বই বা কন্টেন্ট অন্য বিভাগে স্থানান্তর না করে ক্যাটাগরি মুছে ফেলা যাবে না।`,
        },
        { status: 400 }
      );
    }

    // Perform deletion
    await prisma.category.delete({
      where: { id: params.id },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_CATEGORY',
          entity: 'Category',
          entityId: category.id,
          details: JSON.stringify({
            name: category.name,
            slug: category.slug,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/categories/[id]:', error);
    return NextResponse.json(
      { error: 'ক্যাটাগরি মুছতে ব্যর্থ হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}


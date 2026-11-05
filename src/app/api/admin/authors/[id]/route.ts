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

    const author = await prisma.author.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            papers: true,
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
            readingTime: true,
            views: true,
            isFeatured: true,
            publishedAt: true,
            createdAt: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        books: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            coverImage: true,
            stockQuantity: true,
            isPhysicalAvailable: true,
            category: {
              select: { id: true, name: true },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!author) {
      return NextResponse.json({ error: 'লেখক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      author,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/authors/[id]:', error);
    return NextResponse.json(
      { error: 'লেখকের বিস্তারিত তথ্য লোড করতে সমস্যা হয়েছে।', details: error.message },
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

    const existingAuthor = await prisma.author.findUnique({
      where: { id: params.id },
    });

    if (!existingAuthor) {
      return NextResponse.json({ error: 'লেখক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'লেখকের নাম খালি রাখা যাবে না।' }, { status: 400 });
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
      // Check slug uniqueness
      const conflict = await prisma.author.findFirst({
        where: {
          slug: slugVal,
          id: { not: params.id },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: 'এই স্লাগটি ইতোমধ্যে অন্য একজন লেখকের জন্য ব্যবহৃত হয়েছে।' }, { status: 400 });
      }
      updateData.slug = slugVal;
    }

    const directFields = [
      'bio',
      'bioDetails',
      'photoUrl',
      'designation',
      'email',
      'phone',
      'expertise',
      'workplace',
      'education',
      'experience',
      'awards',
      'facebook',
      'linkedin',
      'twitter',
      'instagram',
      'youtube',
      'website',
      'status',
      'seoTitle',
      'seoDescription',
      'ogImage',
    ];

    directFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field] ? String(body[field]).trim() : null;
      }
    });

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
      // Sync status
      if (body.status === undefined) {
        updateData.status = body.isActive ? 'ACTIVE' : 'INACTIVE';
      }
    }

    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
    }

    if (body.isVerified !== undefined) {
      updateData.isVerified = Boolean(body.isVerified);
    }

    const updated = await prisma.author.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            papers: true,
          },
        },
      },
    });

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_AUTHOR',
          entity: 'Author',
          entityId: updated.id,
          details: JSON.stringify({
            updatedFields: Object.keys(updateData),
            name: updated.name,
            status: updated.status,
            isActive: updated.isActive,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      author: updated,
      message: 'লেখক প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/authors/[id]:', error);
    return NextResponse.json(
      { error: 'লেখক প্রোফাইল আপডেট করতে সমস্যা হয়েছে।', details: error.message },
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

    const author = await prisma.author.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            papers: true,
          },
        },
      },
    });

    if (!author) {
      return NextResponse.json({ error: 'লেখক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const totalAttached =
      author._count.books + author._count.articles + author._count.papers;

    if (totalAttached > 0) {
      return NextResponse.json(
        {
          error: `এই লেখকের অধীনে মোট ${totalAttached}টি কন্টেন্ট (${author._count.books}টি বই ও ${author._count.articles}টি প্রবন্ধ) সংযুক্ত রয়েছে। প্রবন্ধ ও বই অন্য লেখকের নামে পুনর্নির্ধারণ বা স্থানান্তর ছাড়া লেখক মোছা সম্ভব নয়।`,
        },
        { status: 400 }
      );
    }

    await prisma.author.delete({
      where: { id: params.id },
    });

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_AUTHOR',
          entity: 'Author',
          entityId: author.id,
          details: JSON.stringify({
            name: author.name,
            slug: author.slug,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'লেখক প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/authors/[id]:', error);
    return NextResponse.json(
      { error: 'লেখক মুছতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}


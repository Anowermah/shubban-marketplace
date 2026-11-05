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

    const { id } = params;
    const publisher = await prisma.publisher.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        _count: {
          select: {
            books: true,
            magazines: true,
          },
        },
        books: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            price: true,
            discountPrice: true,
            stockQuantity: true,
            createdAt: true,
            author: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        magazines: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            createdAt: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'প্রকাশনী সংস্থা পাওয়া যায়নি।' }, { status: 404 });
    }

    // Calculate profile completion score
    let score = 0;
    const totalCriteria = 10;
    if (publisher.name) score++;
    if (publisher.logoUrl) score++;
    if (publisher.description) score++;
    if (publisher.contactPerson) score++;
    if (publisher.email || publisher.phone) score++;
    if (publisher.address || publisher.city) score++;
    if (publisher.website) score++;
    if (publisher.regNumber || publisher.establishedYear) score++;
    if (publisher.facebook || publisher.linkedin || publisher.youtube) score++;
    if (publisher.seoTitle || publisher.seoDescription) score++;
    const profileCompletion = Math.round((score / totalCriteria) * 100);

    const totalPublications = publisher._count.books + publisher._count.magazines;

    return NextResponse.json({
      success: true,
      publisher: {
        ...publisher,
        totalPublications,
        profileCompletion,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/publishers/[id]:', error);
    return NextResponse.json(
      { error: 'প্রকাশনীর বিস্তারিত লোড করতে ব্যর্থ হয়েছে।', details: error.message },
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

    const { id } = params;
    const existing = await prisma.publisher.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'আপডেটযোগ্য প্রকাশনী পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'প্রকাশনীর নাম আবশ্যক।' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn?.trim() || null;

    if (body.slug !== undefined) {
      let finalSlug = generateSlug(body.slug || updateData.name || existing.name);
      if (!finalSlug) finalSlug = `publisher-${Date.now()}`;

      // Check slug uniqueness excluding this record
      const slugExists = await prisma.publisher.findFirst({
        where: {
          slug: finalSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
      updateData.slug = finalSlug;
    }

    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl?.trim() || null;
    if (body.publisherType !== undefined) updateData.publisherType = body.publisherType;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.descriptionDetails !== undefined) updateData.descriptionDetails = body.descriptionDetails?.trim() || null;
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.altPhone !== undefined) updateData.altPhone = body.altPhone?.trim() || null;
    if (body.website !== undefined) updateData.website = body.website?.trim() || null;
    if (body.country !== undefined) updateData.country = body.country?.trim() || 'বাংলাদেশ';
    if (body.division !== undefined) updateData.division = body.division?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city?.trim() || null;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode?.trim() || null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.regNumber !== undefined) updateData.regNumber = body.regNumber?.trim() || null;
    if (body.binNumber !== undefined) updateData.binNumber = body.binNumber?.trim() || null;
    if (body.establishedYear !== undefined) {
      updateData.establishedYear = body.establishedYear ? Number(body.establishedYear) : null;
    }
    if (body.organizationType !== undefined) updateData.organizationType = body.organizationType;
    if (body.mainCategory !== undefined) updateData.mainCategory = body.mainCategory?.trim() || null;
    if (body.specialization !== undefined) updateData.specialization = body.specialization?.trim() || null;
    if (body.facebook !== undefined) updateData.facebook = body.facebook?.trim() || null;
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin?.trim() || null;
    if (body.twitter !== undefined) updateData.twitter = body.twitter?.trim() || null;
    if (body.instagram !== undefined) updateData.instagram = body.instagram?.trim() || null;
    if (body.youtube !== undefined) updateData.youtube = body.youtube?.trim() || null;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'ACTIVE') updateData.isActive = true;
      if (body.status === 'INACTIVE') updateData.isActive = false;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
      if (!body.status) {
        updateData.status = updateData.isActive ? 'ACTIVE' : 'INACTIVE';
      }
    }
    if (body.isVerified !== undefined) updateData.isVerified = Boolean(body.isVerified);
    if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);

    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle?.trim() || null;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription?.trim() || null;
    if (body.ogImage !== undefined) updateData.ogImage = body.ogImage?.trim() || null;

    const updatedPublisher = await prisma.publisher.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            books: true,
            magazines: true,
          },
        },
      },
    });

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE_PUBLISHER',
          entity: 'Publisher',
          entityId: updatedPublisher.id,
          details: JSON.stringify({
            updatedFields: Object.keys(updateData),
            name: updatedPublisher.name,
            status: updatedPublisher.status,
            isVerified: updatedPublisher.isVerified,
            isFeatured: updatedPublisher.isFeatured,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      publisher: updatedPublisher,
      message: 'প্রকাশনীর তথ্য সফলভাবে আপডেট করা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/publishers/[id]:', error);
    return NextResponse.json(
      { error: 'প্রকাশনীর তথ্য আপডেট করতে সমস্যা হয়েছে।', details: error.message },
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

    const { id } = params;

    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            books: true,
            magazines: true,
          },
        },
      },
    });

    if (!publisher) {
      return NextResponse.json({ error: 'মুছে ফেলার জন্য প্রকাশনী পাওয়া যায়নি।' }, { status: 404 });
    }

    const totalPublications = publisher._count.books + publisher._count.magazines;

    // Safety guard: prevent deleting publisher with active publications
    if (totalPublications > 0) {
      return NextResponse.json(
        {
          error: `এই প্রকাশনীর অধীনে ${totalPublications}টি প্রকাশনা (বই: ${publisher._count.books}, ম্যাগাজিন: ${publisher._count.magazines}) যুক্ত রয়েছে। ক্যাটালগ নিরাপত্তা নিশ্চিতে প্রথমে বই/ম্যাগাজিন অন্য প্রকাশনীতে রিঅ্যাসাইন করুন অথবা অপসারণ করুন।`,
          hasPublications: true,
          totalPublications,
          booksCount: publisher._count.books,
          magazinesCount: publisher._count.magazines,
        },
        { status: 400 }
      );
    }

    // Delete publisher
    await prisma.publisher.delete({
      where: { id },
    });

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_PUBLISHER',
          entity: 'Publisher',
          entityId: id,
          details: JSON.stringify({
            name: publisher.name,
            slug: publisher.slug,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'প্রকাশনী সংস্থা সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/publishers/[id]:', error);
    return NextResponse.json(
      { error: 'প্রকাশনী মুছে ফেলতে ব্যর্থ হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}


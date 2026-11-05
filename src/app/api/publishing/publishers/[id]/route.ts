import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        magazines: {
          include: {
            _count: { select: { issues: true, articles: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    if (!publisher) {
      return NextResponse.json({ success: false, error: 'প্রকাশক পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({ success: true, publisher });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.publisher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'প্রকাশক পাওয়া যায়নি' }, { status: 404 });
    }

    const updated = await prisma.publisher.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        nameEn: body.nameEn ?? existing.nameEn,
        slug: body.slug ?? existing.slug,
        publisherType: body.publisherType ?? existing.publisherType,
        organizationType: body.organizationType ?? existing.organizationType,
        contactPerson: body.contactPerson ?? existing.contactPerson,
        email: body.email ?? existing.email,
        phone: body.phone ?? existing.phone,
        website: body.website ?? existing.website,
        address: body.address ?? existing.address,
        description: body.description ?? existing.description,
        logoUrl: body.logoUrl ?? existing.logoUrl,
        regNumber: body.regNumber ?? existing.regNumber,
        binNumber: body.binNumber ?? existing.binNumber,
        establishedYear: body.establishedYear ? Number(body.establishedYear) : existing.establishedYear,
        isVerified: body.isVerified !== undefined ? Boolean(body.isVerified) : existing.isVerified,
        status: body.status ?? existing.status,
      },
    });

    // Record audit log
    await prisma.publicationAuditLog.create({
      data: {
        publisherId: id,
        userId: user.id,
        userName: user.name || user.email,
        action: 'UPDATE',
        targetType: 'PUBLISHER',
        targetId: id,
        details: JSON.stringify({ updatedFields: Object.keys(body) }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'প্রকাশক তথ্য আপডেট হয়েছে',
      publisher: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const [magCount, bookCount] = await Promise.all([
      prisma.magazine.count({ where: { publisherId: id } }),
      prisma.book.count({ where: { publisherId: id } }),
    ]);

    if (magCount > 0 || bookCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `এই প্রকাশকের অধীনে ${magCount}টি সাময়িকী ও ${bookCount}টি বই রয়েছে। ডিলিট করার আগে সেগুলো অন্য প্রকাশকে স্থানান্তর করুন।`,
        },
        { status: 400 }
      );
    }

    await prisma.publisher.delete({ where: { id } });

    await prisma.publicationAuditLog.create({
      data: {
        publisherId: id,
        userId: user.id,
        userName: user.name || user.email,
        action: 'DELETE',
        targetType: 'PUBLISHER',
        targetId: id,
        details: JSON.stringify({ deleted: true }),
      },
    });

    return NextResponse.json({ success: true, message: 'প্রকাশক সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


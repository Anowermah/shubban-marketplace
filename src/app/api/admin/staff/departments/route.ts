import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

// GET: All departments with count of staff and designations
export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        designations: {
          orderBy: { level: 'desc' },
          include: {
            _count: {
              select: { staffMembers: true },
            },
          },
        },
        _count: {
          select: {
            staffMembers: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    console.error('Department GET Error:', error);
    return NextResponse.json({ success: false, error: 'ডিপার্টমেন্ট লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Create new department
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const { name, nameEn, slug, code, description, headId, status = 'ACTIVE' } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'ডিপার্টমেন্টের নাম ও কোড আবশ্যক' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `dept-${Date.now()}`;
    const cleanCode = code.toUpperCase().trim();

    // Check duplicate
    const existing = await prisma.department.findFirst({
      where: {
        OR: [{ slug: generatedSlug }, { code: cleanCode }],
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'এই স্লাগ বা কোড সম্বলিত ডিপার্টমেন্ট ইতিমধ্যে রয়েছে।' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name,
        nameEn: nameEn || null,
        slug: generatedSlug,
        code: cleanCode,
        description: description || null,
        headId: headId || null,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ডিপার্টমেন্ট সফলভাবে তৈরি হয়েছে।',
      data: department,
    });
  } catch (error: any) {
    console.error('Department POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'ডিপার্টমেন্ট তৈরিতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}


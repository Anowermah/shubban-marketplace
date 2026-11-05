import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

// GET: All designations, optionally filtered by departmentId
export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = {};
    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    const designations = await prisma.designation.findMany({
      where,
      orderBy: [{ departmentId: 'asc' }, { level: 'desc' }],
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: { staffMembers: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: designations,
    });
  } catch (error: any) {
    console.error('Designation GET Error:', error);
    return NextResponse.json({ success: false, error: 'পদবি লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Create designation
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const { name, nameEn, departmentId, level = 1, description } = body;

    if (!name || !departmentId) {
      return NextResponse.json({ success: false, error: 'পদবির নাম এবং ডিপার্টমেন্ট নির্বাচন আবশ্যক' }, { status: 400 });
    }

    const designation = await prisma.designation.create({
      data: {
        name,
        nameEn: nameEn || null,
        departmentId,
        level: parseInt(String(level)) || 1,
        description: description || null,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'পদবি সফলভাবে তৈরি হয়েছে।',
      data: designation,
    });
  } catch (error: any) {
    console.error('Designation POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'পদবি তৈরিতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}


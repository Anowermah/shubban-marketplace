import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET: List staff with filtering, search & pagination
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const departmentId = searchParams.get('departmentId');
    const designationId = searchParams.get('designationId');
    const status = searchParams.get('status');
    const employmentType = searchParams.get('employmentType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    if (designationId && designationId !== 'ALL') {
      where.designationId = designationId;
    }

    if (status && status !== 'ALL') {
      where.employmentStatus = status;
    }

    if (employmentType && employmentType !== 'ALL') {
      where.employmentType = employmentType;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [total, staff] = await Promise.all([
      prisma.staffProfile.count({ where }),
      prisma.staffProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              avatarUrl: true,
              status: true,
              lastLoginAt: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          designation: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          supervisor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Staff GET Error:', error);
    return NextResponse.json({ success: false, error: 'স্টাফ তালিকা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Create / Onboard new staff profile
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র অ্যাডমিন নতুন স্টাফ যুক্ত করতে পারেন' }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      email,
      name,
      phone,
      password,
      role = 'ADMIN',
      departmentId,
      designationId,
      supervisorId,
      employmentType = 'FULL_TIME',
      employmentStatus = 'ACTIVE',
      joiningDate,
      workResponsibilities,
      emergencyContact,
      professionalBio,
      internalNotes,
      salaryGrade,
    } = body;

    let targetUserId = userId;

    // If userId not provided, either find user by email or create new user
    if (!targetUserId) {
      if (!email || !name) {
        return NextResponse.json({ success: false, error: 'নাম ও ইমেইল আবশ্যক' }, { status: 400 });
      }

      let existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const passwordHash = await bcrypt.hash(password || 'Shubban@123456', 10);
        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            phone: phone || null,
            passwordHash,
            role: role || 'ADMIN',
            status: 'ACTIVE',
          },
        });
        targetUserId = newUser.id;
      }
    }

    // Check if staff profile already exists for this user
    const existingProfile = await prisma.staffProfile.findUnique({
      where: { userId: targetUserId },
    });
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'এই ব্যবহারকারীর ইতিমধ্যে একটি স্টাফ প্রোফাইল বিদ্যমান রয়েছে।' },
        { status: 400 }
      );
    }

    // Generate unique employeeId
    const totalStaffCount = await prisma.staffProfile.count();
    const employeeId = body.employeeId || `SL-EMP-${String(totalStaffCount + 1).padStart(3, '0')}`;

    // Verify employeeId is unique
    const duplicateEmp = await prisma.staffProfile.findUnique({ where: { employeeId } });
    const finalEmpId = duplicateEmp ? `${employeeId}-${Date.now().toString().slice(-3)}` : employeeId;

    const staffProfile = await prisma.staffProfile.create({
      data: {
        userId: targetUserId,
        employeeId: finalEmpId,
        departmentId: departmentId || null,
        designationId: designationId || null,
        supervisorId: supervisorId || null,
        employmentType,
        employmentStatus,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        workResponsibilities: workResponsibilities || null,
        emergencyContact: typeof emergencyContact === 'object' ? JSON.stringify(emergencyContact) : emergencyContact || null,
        professionalBio: professionalBio || null,
        internalNotes: internalNotes || null,
        salaryGrade: salaryGrade || null,
      },
      include: {
        user: true,
        department: true,
        designation: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'স্টাফ প্রোফাইল সফলভাবে তৈরি হয়েছে।',
      data: staffProfile,
    });
  } catch (error: any) {
    console.error('Staff POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'স্টাফ প্রোফাইল তৈরি করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}


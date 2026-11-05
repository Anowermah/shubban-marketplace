import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const CUSTOMER_ROLES = ['CUSTOMER', 'REGISTERED_MEMBER', 'PAID_MEMBER', 'GUEST', 'READER', 'SUBSCRIBER'];

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all'; // all, ACTIVE, INACTIVE, PENDING_VERIFICATION, SUSPENDED, BLOCKED
    const emailVerified = searchParams.get('emailVerified') || 'all'; // all, verified, unverified
    const phoneVerified = searchParams.get('phoneVerified') || 'all';
    const customerType = searchParams.get('customerType') || 'all'; // all, INDIVIDUAL, BUSINESS, INSTITUTIONAL, WHOLESALE
    const membershipTier = searchParams.get('membershipTier') || 'all'; // all, FREE, DIGITAL, PREMIUM, INSTITUTIONAL
    const tag = searchParams.get('tag') || 'all';
    const city = searchParams.get('city')?.trim() || '';
    const country = searchParams.get('country')?.trim() || '';
    const dateFilter = searchParams.get('dateFilter') || 'all'; // all, today, 7days, 30days, thisMonth, thisYear
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // name, createdAt, orders, spending, lastLogin
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || '25';
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.max(1, parseInt(limitParam, 10));

    // 1. Calculate Real Database Statistics (6 Summary Cards)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      newCustomersThisMonth,
      totalOrders,
      verifiedEmailAccounts,
      availableTags,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { in: CUSTOMER_ROLES } } }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          status: { in: ['INACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING_VERIFICATION'] },
        },
      }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.order.count({
        where: {
          user: { role: { in: CUSTOMER_ROLES } },
        },
      }),
      prisma.user.count({
        where: {
          role: { in: CUSTOMER_ROLES },
          isVerified: true,
        },
      }),
      prisma.customerTag.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    const stats = {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      newCustomersThisMonth,
      totalOrders,
      verifiedEmailAccounts,
    };

    // 2. Build Where Clauses
    const where: any = {
      role: { in: CUSTOMER_ROLES },
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { username: { contains: search } },
        { id: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (status !== 'all') {
      if (status === 'ACTIVE') {
        where.status = 'ACTIVE';
      } else {
        where.status = status;
      }
    }

    if (emailVerified === 'verified') {
      where.isVerified = true;
    } else if (emailVerified === 'unverified') {
      where.isVerified = false;
    }

    if (phoneVerified === 'verified') {
      where.isPhoneVerified = true;
    } else if (phoneVerified === 'unverified') {
      where.isPhoneVerified = false;
    }

    if (customerType !== 'all') {
      where.customerType = customerType;
    }

    if (membershipTier !== 'all') {
      where.membershipTier = membershipTier;
    }

    if (tag !== 'all') {
      where.customerTags = { contains: tag };
    }

    if (city) {
      where.city = { contains: city };
    }

    if (country) {
      where.country = { contains: country };
    }

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    } else if (dateFilter === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      where.createdAt = { gte: past7 };
    } else if (dateFilter === '30days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      where.createdAt = { gte: past30 };
    } else if (dateFilter === 'thisMonth') {
      where.createdAt = { gte: startOfMonth };
    } else if (dateFilter === 'thisYear') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      where.createdAt = { gte: startOfYear };
    }

    // 3. Sorting
    let orderBy: any = [];
    if (sortBy === 'name') {
      orderBy = [{ name: sortOrder }];
    } else if (sortBy === 'lastLogin') {
      orderBy = [{ lastLoginAt: sortOrder }, { createdAt: 'desc' }];
    } else if (sortBy === 'createdAt') {
      orderBy = [{ createdAt: sortOrder }];
    } else {
      orderBy = [{ createdAt: 'desc' }];
    }

    // 4. Query with server-side pagination
    const total = await prisma.user.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const customers = await prisma.user.findMany({
      where,
      orderBy,
      skip: isAll ? 0 : skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        isVerified: true,
        isPhoneVerified: true,
        membershipTier: true,
        membershipExpiry: true,
        customerType: true,
        customerTags: true,
        country: true,
        division: true,
        city: true,
        area: true,
        postalCode: true,
        fullAddress: true,
        adminNotes: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
            orderStatus: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    // Format customers with calculated statistics (Total Spent, Average Order Value)
    const formattedCustomers = customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === 'PAID');
      const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
      const avgOrderValue = paidOrders.length > 0 ? Math.round(totalSpent / paidOrders.length) : 0;

      // Profile completion calculation
      let score = 0;
      const totalCriteria = 8;
      if (c.name) score++;
      if (c.email) score++;
      if (c.phone) score++;
      if (c.avatarUrl) score++;
      if (c.city || c.fullAddress) score++;
      if (c.isVerified) score++;
      if (c.orders.length > 0) score++;
      if (c.customerTags) score++;
      const completionPercentage = Math.round((score / totalCriteria) * 100);

      // Parse tags
      let parsedTags: string[] = [];
      try {
        if (c.customerTags) {
          parsedTags = JSON.parse(c.customerTags);
        }
      } catch (e) {
        parsedTags = [c.customerTags];
      }

      return {
        ...c,
        status: c.status || 'ACTIVE',
        customerTags: parsedTags,
        totalSpent,
        avgOrderValue,
        completionPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      customers: formattedCustomers,
      availableTags,
      pagination: {
        total,
        page: safePage,
        limit,
        totalPages,
        showingFrom: total > 0 ? skip + 1 : 0,
        showingTo: Math.min(skip + limit, total),
      },
    });
  } catch (error: any) {
    console.error('Admin Customers GET error:', error);
    return NextResponse.json({ error: error.message || 'গ্রাহক তথ্য লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      username,
      gender,
      dateOfBirth,
      customerType = 'INDIVIDUAL',
      membershipTier = 'FREE',
      status = 'ACTIVE',
      isVerified = false,
      isPhoneVerified = false,
      customerTags = [],
      country = 'Bangladesh',
      division,
      city,
      area,
      postalCode,
      fullAddress,
      adminNotes,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'গ্রাহকের পুরো নাম আবশ্যক।' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'ইমেইল ঠিকানা আবশ্যক।' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: `এই ইমেইল (${cleanEmail}) দ্বারা ইতিমধ্যে একটি একাউন্ট বিদ্যমান রয়েছে।` }, { status: 400 });
    }

    // Hash password
    const rawPassword = password?.trim() || 'Shubban@' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const generatedUsername = (username?.trim() || cleanEmail.split('@')[0] + '-' + Math.floor(100 + Math.random() * 900)).toLowerCase();

    const newCustomer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone?.trim() || null,
        passwordHash,
        username: generatedUsername,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        role: 'CUSTOMER',
        status,
        customerType,
        membershipTier,
        isVerified: Boolean(isVerified),
        isPhoneVerified: Boolean(isPhoneVerified),
        customerTags: Array.isArray(customerTags) ? JSON.stringify(customerTags) : null,
        country: country?.trim() || 'Bangladesh',
        division: division?.trim() || null,
        city: city?.trim() || null,
        area: area?.trim() || null,
        postalCode: postalCode?.trim() || null,
        fullAddress: fullAddress?.trim() || null,
        adminNotes: adminNotes?.trim() || null,
      },
    });

    // If address is provided, also create an Address record
    if (fullAddress && fullAddress.trim()) {
      await prisma.address.create({
        data: {
          userId: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone || '',
          address: fullAddress.trim(),
          city: city?.trim() || 'ঢাকা',
          isDefault: true,
        },
      });
    }

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CUSTOMER_CREATED',
          entity: 'USER',
          entityId: newCustomer.id,
          details: `অ্যাডমিন ${user.name} নতুন গ্রাহক একাউন্ট '${newCustomer.name}' (${newCustomer.email}) তৈরি করেছেন।`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'নতুন গ্রাহক একাউন্ট সফলভাবে তৈরি হয়েছে!',
      customer: newCustomer,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Customers POST error:', error);
    return NextResponse.json({ error: error.message || 'গ্রাহক তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const CUSTOMER_ROLES = ['CUSTOMER', 'REGISTERED_MEMBER', 'PAID_MEMBER', 'GUEST', 'READER', 'SUBSCRIBER'];

// GET: Full Customer Details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { id } = params;

    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            subtotal: true,
            discount: true,
            shippingFee: true,
            paymentStatus: true,
            orderStatus: true,
            paymentMethod: true,
            shippingAddress: true,
            shippingPhone: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                bookId: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                book: {
                  select: {
                    title: true,
                    coverImage: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            book: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            comments: true,
            bookmarks: true,
            addresses: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'গ্রাহকের তথ্য পাওয়া যায়নি।' }, { status: 404 });
    }

    // Additional audit logs related to this customer (e.g. actions by admins on this user)
    const entityAuditLogs = await prisma.auditLog.findMany({
      where: {
        entity: 'USER',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Calculate detailed financial and shopping statistics
    const allPaidOrders = customer.orders.filter((o) => o.paymentStatus === 'PAID');
    const totalSpent = allPaidOrders.reduce((sum, o) => sum + o.total, 0);
    const completedOrders = customer.orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const pendingOrders = customer.orders.filter((o) => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.orderStatus)).length;
    const cancelledOrders = customer.orders.filter((o) => ['CANCELLED', 'RETURNED'].includes(o.orderStatus)).length;
    const avgOrderValue = allPaidOrders.length > 0 ? Math.round(totalSpent / allPaidOrders.length) : 0;

    // Parse customer tags
    let parsedTags: string[] = [];
    try {
      if (customer.customerTags) {
        parsedTags = JSON.parse(customer.customerTags);
      }
    } catch {
      parsedTags = [customer.customerTags || ''];
    }

    // Build timeline events
    const timeline = [
      {
        id: `created-${customer.id}`,
        title: 'অ্যাকাউন্ট নিবন্ধন সম্পন্ন হয়েছে',
        type: 'REGISTRATION',
        timestamp: customer.createdAt,
        details: `গ্রাহক ${customer.role} হিসেবে নিবন্ধিত হয়েছেন।`,
      },
    ];

    if (customer.lastLoginAt) {
      timeline.push({
        id: `login-${customer.id}`,
        title: 'সর্বশেষ লগইন কার্যক্রম',
        type: 'LOGIN',
        timestamp: customer.lastLoginAt,
        details: 'সফলভাবে প্ল্যাটফর্মে লগইন করেছেন।',
      });
    }

    customer.orders.forEach((o) => {
      timeline.push({
        id: `order-${o.id}`,
        title: `নতুন অর্ডার #${o.orderNumber || o.id.slice(-6).toUpperCase()}`,
        type: 'ORDER',
        timestamp: o.createdAt,
        details: `অর্ডারের মূল্য: ৳${o.total} (${o.orderStatus})`,
      });
    });

    entityAuditLogs.forEach((log) => {
      timeline.push({
        id: `audit-${log.id}`,
        title: log.action,
        type: 'ADMIN_ACTION',
        timestamp: log.createdAt,
        details: `${log.user?.name || 'অ্যাডমিন'}: ${log.details || ''}`,
      });
    });

    // Sort timeline descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        customerTags: parsedTags,
        stats: {
          totalOrders: customer._count.orders,
          completedOrders,
          pendingOrders,
          cancelledOrders,
          totalSpent,
          avgOrderValue,
          reviewsCount: customer._count.reviews,
          commentsCount: customer._count.comments,
          bookmarksCount: customer._count.bookmarks,
          addressesCount: customer._count.addresses,
        },
        timeline,
        entityAuditLogs,
      },
    });
  } catch (error: any) {
    console.error('Customer details GET error:', error);
    return NextResponse.json({ error: error.message || 'গ্রাহকের বিবরণ লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

// PUT: Update Customer Profile & Details
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const {
      name,
      email,
      phone,
      username,
      bio,
      avatarUrl,
      dateOfBirth,
      gender,
      customerType,
      membershipTier,
      membershipExpiry,
      status,
      isVerified,
      isPhoneVerified,
      country,
      division,
      city,
      area,
      postalCode,
      fullAddress,
      adminNotes,
      customerTags,
      password,
    } = body;

    // Check unique email if changed
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailClash = await prisma.user.findFirst({
        where: {
          email: { equals: email.trim().toLowerCase() },
          id: { not: id },
        },
      });
      if (emailClash) {
        return NextResponse.json({ error: 'এই ইমেইলটি অন্য গ্রাহকের অ্যাকাউন্টে ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 400 });
      }
    }

    // Check unique username if changed
    if (username && username !== existingUser.username) {
      const usernameClash = await prisma.user.findFirst({
        where: {
          username: { equals: username.trim().toLowerCase() },
          id: { not: id },
        },
      });
      if (usernameClash) {
        return NextResponse.json({ error: 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে।' }, { status: 400 });
      }
    }

    // Prepare update payload
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (username !== undefined) updateData.username = username?.trim().toLowerCase() || null;
    if (bio !== undefined) updateData.bio = bio?.trim() || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl?.trim() || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (customerType !== undefined) updateData.customerType = customerType;
    if (membershipTier !== undefined) updateData.membershipTier = membershipTier;
    if (membershipExpiry !== undefined) {
      updateData.membershipExpiry = membershipExpiry ? new Date(membershipExpiry) : null;
    }
    if (status !== undefined) updateData.status = status;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);
    if (isPhoneVerified !== undefined) updateData.isPhoneVerified = Boolean(isPhoneVerified);
    if (country !== undefined) updateData.country = country?.trim() || 'Bangladesh';
    if (division !== undefined) updateData.division = division?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (area !== undefined) updateData.area = area?.trim() || null;
    if (postalCode !== undefined) updateData.postalCode = postalCode?.trim() || null;
    if (fullAddress !== undefined) updateData.fullAddress = fullAddress?.trim() || null;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes?.trim() || null;

    if (customerTags !== undefined) {
      updateData.customerTags = Array.isArray(customerTags)
        ? JSON.stringify(customerTags)
        : typeof customerTags === 'string'
        ? customerTags
        : null;
    }

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE_CUSTOMER_PROFILE',
        entity: 'USER',
        entityId: id,
        details: `অ্যাডমিন ${adminUser.name} গ্রাহক ${updatedUser.name} (${updatedUser.email})-এর তথ্য আপডেট করেছেন।`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'গ্রাহকের তথ্য সফলভাবে আপডেট করা হয়েছে।',
      customer: updatedUser,
    });
  } catch (error: any) {
    console.error('Customer update PUT error:', error);
    return NextResponse.json({ error: error.message || 'গ্রাহকের তথ্য আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

// DELETE: Safe Customer Deletion
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { id } = params;

    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // Safety rule: Never delete a customer who has orders (preserves accounting, invoice, and tax trail)
    if (userToDelete._count.orders > 0) {
      return NextResponse.json(
        {
          error: `এই গ্রাহকের ইতিমধ্যে ${userToDelete._count.orders}টি ক্রয়াদেশ (Order) রয়েছে। আর্থিক ও ট্যাক্স রেকর্ড সুরক্ষার স্বার্থে অর্ডারসহ অ্যাকাউন্ট স্থায়ীভাবে মোছা যাবে না। আপনি চাইলে অ্যাকাউন্টটি 'BLOCKED' বা 'INACTIVE' করতে পারেন।`,
          isProtected: true,
        },
        { status: 400 }
      );
    }

    // Safe delete cascade for non-order entities
    await prisma.$transaction([
      prisma.address.deleteMany({ where: { userId: id } }),
      prisma.bookmark.deleteMany({ where: { userId: id } }),
      prisma.readingProgress.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'DELETE_CUSTOMER',
          entity: 'USER',
          entityId: id,
          details: `অ্যাডমিন ${adminUser.name} শূন্য অর্ডারের গ্রাহক ${userToDelete.name} (${userToDelete.email})-কে স্থায়ীভাবে মুছে ফেলেছেন।`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'গ্রাহকের অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: error.message || 'গ্রাহক অ্যাকাউন্ট মুছতে ব্যর্থ।' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const {
      shopName,
      ownerName,
      phone,
      email,
      businessAddress,
      city,
      businessType,
      tradeLicense,
      nidNumber,
      description,
    } = await req.json();

    if (!shopName || !ownerName || !phone || !email || !businessAddress) {
      return NextResponse.json(
        { error: 'দোকানের নাম, মালিকের নাম, ফোন ও ঠিকানা পূরণ করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const session = await getSessionUser();
    let userId = session?.id;

    if (!userId) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email,
            name: ownerName,
            phone,
            passwordHash: '$2a$10$wT7W2Q0lK8hN5L6U1.G7s.9K2zX8w9m2v3kL1p4j6s8d9f0g1h2j3', // temporary default
            role: 'REGISTERED_MEMBER',
          },
        });
        userId = newUser.id;
      }
    }

    const shopSlug = `${shopName
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .slice(0, 40)}-${Date.now().toString().slice(-4)}`;

    const application = await prisma.vendorApplication.create({
      data: {
        userId,
        shopName,
        shopSlug,
        ownerName,
        phone,
        email,
        businessAddress,
        city: city || 'ঢাকা',
        businessType: businessType || 'BOOKSTORE',
        tradeLicense: tradeLicense || null,
        nidNumber: nidNumber || null,
        description: description || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      application,
      message: 'আপনার বিক্রেতা আবেদনটি সফলভাবে জমা হয়েছে। শুব্বান মার্কেটপ্লেস টিম দ্রুত আপনার সাথে যোগাযোগ করবে!',
    });
  } catch (error) {
    console.error('Seller apply error:', error);
    return NextResponse.json({ error: 'আবেদন প্রক্রিয়াকরণে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}


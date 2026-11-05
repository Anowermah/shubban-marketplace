import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorAuth.vendor.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'বিক্রেতার তথ্য পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        legalName: vendor.legalName,
        slug: vendor.slug,
        description: vendor.description,
        logoUrl: vendor.logoUrl,
        bannerUrl: vendor.bannerUrl,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        nidOrTradeLicense: vendor.nidOrTradeLicense,
        bankName: vendor.bankName,
        bankAccountName: vendor.bankAccountName,
        bankAccountNumber: vendor.bankAccountNumber,
        bankRoutingNumber: vendor.bankRoutingNumber,
        bkashMerchantNumber: vendor.bkashMerchantNumber,
        rating: vendor.rating,
        ratingCount: vendor.ratingCount,
        commissionRate: vendor.commissionRate ?? 10,
        status: vendor.status,
        isVerified: vendor.isVerified,
        isFeatured: vendor.isFeatured,
        isSuspended: vendor.status === 'SUSPENDED',
        members: vendor.members,
        createdAt: vendor.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Fetch seller settings error:', error);
    return NextResponse.json({ error: 'বিক্রেতা সেটিংস লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    if (vendorAuth.isSuspended) {
      return NextResponse.json(
        { error: 'আপনার অ্যাকাউন্টটি স্থগিত রয়েছে। সেটিংস পরিবর্তন করা সম্ভব নয়।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      legalName,
      description,
      logoUrl,
      bannerUrl,
      phone,
      address,
      city,
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankRoutingNumber,
      bkashMerchantNumber,
    } = body;

    const updated = await prisma.vendor.update({
      where: { id: vendorAuth.vendor.id },
      data: {
        ...(name ? { name } : {}),
        ...(legalName !== undefined ? { legalName } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl } : {}),
        ...(phone ? { phone } : {}),
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(bankName !== undefined ? { bankName } : {}),
        ...(bankAccountName !== undefined ? { bankAccountName } : {}),
        ...(bankAccountNumber !== undefined ? { bankAccountNumber } : {}),
        ...(bankRoutingNumber !== undefined ? { bankRoutingNumber } : {}),
        ...(bkashMerchantNumber !== undefined ? { bkashMerchantNumber } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'দোকান সেটিংস ও ব্র্যান্ডিং সফলভাবে সংরক্ষণ করা হয়েছে!',
      vendor: updated,
    });
  } catch (error: any) {
    console.error('Update seller settings error:', error);
    return NextResponse.json({ error: error.message || 'সেটিংস আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}


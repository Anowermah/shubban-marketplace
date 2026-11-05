import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    // Find advertiser where user is owner or member
    let advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [
          { ownerId: session.id },
          { members: { some: { userId: session.id } } },
        ],
      },
      include: {
        _count: { select: { campaigns: true, creatives: true, invoices: true } },
      },
    });

    return NextResponse.json({ success: true, advertiser });
  } catch (err: any) {
    console.error('Error fetching advertiser profile:', err);
    return NextResponse.json({ error: 'প্রোফাইল লোড করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, contactName, email, phone, website, address, city, taxId } = body;

    if (!companyName || !email) {
      return NextResponse.json({ error: 'প্রতিষ্ঠানের নাম এবং ইমেইল আবশ্যক।' }, { status: 400 });
    }

    // Generate unique slug
    const cleanSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30) || 'org';
    const slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;

    const advertiser = await prisma.advertiser.create({
      data: {
        name: contactName?.trim() || session.name,
        companyName: companyName.trim(),
        slug,
        email: email.trim(),
        phone: phone?.trim(),
        website: website?.trim(),
        address: address?.trim(),
        city: city?.trim(),
        taxId: taxId?.trim(),
        status: 'ACTIVE', // Automatically activate onboarding, campaigns undergo approval
        verifiedAt: new Date(),
        ownerId: session.id,
      },
    });

    return NextResponse.json({ success: true, advertiser });
  } catch (err: any) {
    console.error('Error creating advertiser organization:', err);
    return NextResponse.json({ error: 'প্রতিষ্ঠান রেজিস্ট্রেশন করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json();
    const { id, companyName, contactName, phone, website, address, city, taxId, logoUrl } = body;

    // Strict tenant isolation: verify ownership
    const advertiser = await prisma.advertiser.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.id },
          { members: { some: { userId: session.id, role: { in: ['OWNER', 'MANAGER'] } } } },
        ],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ error: 'অনুমোদনহীন অ্যাক্সেস।' }, { status: 403 });
    }

    const updated = await prisma.advertiser.update({
      where: { id },
      data: {
        companyName: companyName !== undefined ? companyName : undefined,
        name: contactName !== undefined ? contactName : undefined,
        phone: phone !== undefined ? phone : undefined,
        website: website !== undefined ? website : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        taxId: taxId !== undefined ? taxId : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, advertiser: updated });
  } catch (err: any) {
    console.error('Error updating advertiser organization:', err);
    return NextResponse.json({ error: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}


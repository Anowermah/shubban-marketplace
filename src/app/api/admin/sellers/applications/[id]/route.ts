import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { status, adminNotes } = await req.json();

    const app = await prisma.vendorApplication.findUnique({
      where: { id: params.id },
    });

    if (!app) {
      return NextResponse.json({ error: 'আবেদনপত্র পাওয়া যায়নি।' }, { status: 404 });
    }

    const updatedApp = await prisma.vendorApplication.update({
      where: { id: params.id },
      data: {
        status,
        ...(adminNotes ? { adminNotes } : {}),
      },
    });

    // If approved, create Vendor and assign user as OWNER
    if (status === 'APPROVED') {
      const vendor = await prisma.vendor.create({
        data: {
          name: app.shopName,
          slug: app.shopSlug,
          email: app.email,
          phone: app.phone,
          address: app.businessAddress,
          city: app.city,
          description: app.description || `${app.shopName}-এর অফিশিয়াল মার্কেটপ্লেস শপ।`,
          status: 'APPROVED',
          isVerified: true,
          nidOrTradeLicense: app.tradeLicense || app.nidNumber || null,
          members: {
            create: {
              userId: app.userId,
              role: 'OWNER',
            },
          },
        },
      });

      // Update user role
      await prisma.user.update({
        where: { id: app.userId },
        data: { role: 'PUBLISHER' },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: app.userId,
          title: 'অভিনন্দন! আপনার বিক্রেতা আবেদন অনুমোদিত হয়েছে',
          message: `আপনার “${app.shopName}” শপটি শুব্বান মার্কেটপ্লেসে যুক্ত হয়েছে। এখন থেকে আপনি পণ্য লিস্টিং ও অর্ডার পরিচালনা করতে পারেন।`,
          link: '/seller/dashboard',
        },
      });
    }

    return NextResponse.json({
      success: true,
      application: updatedApp,
      message: status === 'APPROVED' ? 'আবেদনটি অনুমোদিত হয়েছে এবং নতুন ভেন্ডর শপ তৈরি হয়েছে!' : 'আবেদনটি বাতিল করা হয়েছে।',
    });
  } catch (error) {
    console.error('App review error:', error);
    return NextResponse.json({ error: 'আবেদন পর্যালোচনায় সমস্যা হয়েছে।' }, { status: 500 });
  }
}


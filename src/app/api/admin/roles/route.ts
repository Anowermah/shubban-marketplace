import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getVerifiedSessionUser,
  isAdmin,
  isSuperAdmin,
  ROLE_LEVELS,
  ROLE_PERMISSIONS,
  getDynamicRolePermissions,
  saveDynamicRolePermissions,
  Permission,
} from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const ROLE_METADATA: Record<string, { name: string; description: string; isProtected?: boolean }> = {
  SUPER_ADMIN: {
    name: 'সুপার অ্যাডমিনিস্ট্রেটর (Super Admin)',
    description: 'প্ল্যাটফর্মের সর্বোচ্চ কর্তৃত্ব। সিস্টেম সেটিংস, অডিট লগ, ইউজার ডাটাবেজ ও আর্থিক পে-আউট নিয়ন্ত্রণ।',
    isProtected: true,
  },
  ADMIN: {
    name: 'মার্কেটপ্লেস অ্যাডমিন (Admin)',
    description: 'মার্কেটপ্লেস ও ক্যাটালগ পরিচালনা, অর্ডার মনিটরিং, সেলার অনুমোদন ও গ্রাহক সেবা তত্ত্বাবধান।',
    isProtected: true,
  },
  FINANCE_MANAGER: {
    name: 'ফাইন্যান্স ম্যানেজার (Finance Manager)',
    description: 'বিক্রেতা পে-আউট অনুমোদন, কমিশন হিসাব, অর্থ লেনদেন নিরীক্ষা ও অনুদান তহবিল অডিট।',
  },
  STORE_MANAGER: {
    name: 'স্টোর ও ইনভেন্টরি ম্যানেজার (Store Manager)',
    description: 'মার্কেটপ্লেস পণ্য ক্যাটালগ, ইনভেন্টরি স্টক লেভেল এবং সেন্ট্রাল অর্ডার ডেলিভারি পরিচালনা।',
  },
  MAGAZINE_ADMIN: {
    name: 'ডিজিটাল সাময়িকী অ্যাডমিন (Magazine Admin)',
    description: 'সকল স্বাধীন ইসলামিক সাময়িকী, বিশেষ সংখ্যা, সম্পাদকীয় বোর্ড ও গ্রাহক রিডিং অ্যাক্সেস নিয়ন্ত্রণ।',
  },
  EDITOR: {
    name: 'প্রধান সম্পাদক ও রিভিউয়ার (Chief Editor)',
    description: 'লেখক পাণ্ডুলিপি যাচাই, আর্টিকেলের বিষয়বস্তু সম্পাদনা ও নতুন সাহিত্য সাময়িকী প্রকাশের অধিকার।',
  },
  MODERATOR: {
    name: 'কমিউনিটি মডারেটর (Moderator)',
    description: 'পাঠকদের জিজ্ঞাসা, উত্তর ও বই পর্যালোচনার ইসলামিক নৈতিক মানদণ্ড বজায় রাখা।',
  },
  CUSTOMER_SUPPORT: {
    name: 'কাস্টমার সাপোর্ট অফিসার (Support Staff)',
    description: 'গ্রাহকদের অর্ডার ট্র্যাকিং সহায়তা, ডেলিভারি সমস্যা ও সাপোর্ট টিকিটের সমাধান।',
  },
  REVIEWER: {
    name: 'বই ও সাহিত্য পর্যালোচক (Reviewer)',
    description: 'বইয়ের গঠনমূলক সমালোচনা ও পাঠকদের রিভিউ মান নিশ্চিতকরণ।',
  },
  SELLER: {
    name: 'মার্কেটপ্লেস বিক্রেতা (Seller / Vendor)',
    description: 'নিজস্ব স্টোরের বই ও পণ্য তালিকাভুক্তি, ইনভেন্টরি স্টক ও সাব-অর্ডার ফুলফিলমেন্ট।',
  },
  PUBLISHER: {
    name: 'প্রকাশক অ্যাডমিন (Publisher Admin)',
    description: 'প্রকাশনা প্রতিষ্ঠানের প্রোফাইল, নিজস্ব প্রকাশনার বই ও ডিজিটাল সংস্করণের অনুমোদন।',
  },
  AUTHOR: {
    name: 'লেখক ও প্রবন্ধকার (Author)',
    description: 'প্রবন্ধ, গবেষণা পত্র ও বই প্রকাশনার জন্য পাণ্ডুলিপি জমা এবং লেখক প্রোফাইল পরিচালনা।',
  },
  CONTRIBUTOR: {
    name: 'কন্ট্রিবিউটর (Contributor)',
    description: 'সাময়িকী ও অনলাইন পোর্টালে মৌলিক লেখা, অনুবাদ ও আলোচনা জমা দেওয়ার সুযোগ।',
  },
  PAID_MEMBER: {
    name: 'পেইড ডিজিটাল সদস্য (Paid Member)',
    description: 'ডিজিটাল ই-বুক রিডার অ্যাক্সেস, বিশেষ ছাড় ও প্রিমিয়াম ম্যাগাজিন পড়ার সুবিধা।',
  },
  CUSTOMER: {
    name: 'সম্মানিত ক্রেতা সদস্য (Customer)',
    description: 'বই ও পণ্য ক্রয়, অর্ডার ট্র্যাকিং এবং ব্যক্তিগত লাইব্রেরী সুবিধা।',
  },
  REGISTERED_MEMBER: {
    name: 'সাধারণ নিবন্ধিত পাঠক (Registered Member)',
    description: 'বিনামূল্যে উন্মুক্ত বই পাঠ, প্রশ্নোত্তর সেশনে অংশগ্রহণ ও পছন্দের তালিকা সংরক্ষণ।',
  },
  GUEST: {
    name: 'অতিথি পাঠক (Guest)',
    description: 'উন্মুক্ত বই ও প্রকাশনা ব্রাউজিং ও পড়ার প্রাথমিক অনুমতি।',
  },
};

const PERMISSION_GROUPS = [
  {
    category: 'প্ল্যাটফর্ম প্রশাসন (Platform Admin)',
    permissions: [
      { key: 'VIEW_ADMIN_DASHBOARD', label: 'অ্যাডমিন ড্যাশবোর্ড প্রদর্শন' },
      { key: 'MANAGE_USERS', label: 'ব্যবহারকারী ও রোল পরিচালনা' },
      { key: 'MANAGE_SETTINGS', label: 'সিস্টেম সেটিংস পরিবর্তন' },
      { key: 'VIEW_AUDIT_LOGS', label: 'নিরাপত্তা অডিট লগ নিরীক্ষা' },
    ],
  },
  {
    category: 'মার্কেটপ্লেস ও বিক্রেতা প্রশাসন (Marketplace & Sellers)',
    permissions: [
      { key: 'MANAGE_SELLERS', label: 'সেলার প্রোফাইল ও স্থিতি পরিচালনা' },
      { key: 'APPROVE_SELLER_APPLICATIONS', label: 'সেলার আবেদন যাচাই ও অনুমোদন' },
      { key: 'MANAGE_COMMISSIONS', label: 'মার্কেটপ্লেস কমিশন হার নির্ধারণ' },
      { key: 'VIEW_ALL_ORDERS', label: 'সকল গ্রাহক ও সেলার অর্ডার প্রদর্শন' },
      { key: 'MANAGE_ALL_ORDERS', label: 'অর্ডার স্থিতি ও চালান সংশোধন' },
      { key: 'PROCESS_PAYOUTS', label: 'সেলার উইথড্রয়াল ও পে-আউট অনুমোদন' },
      { key: 'MANAGE_ALL_PRODUCTS', label: 'কেন্দ্রীয় পণ্য ক্যাটালগ নিয়ন্ত্রণ' },
    ],
  },
  {
    category: 'সেলার সেলফ-সার্ভিস (Vendor / Seller Portal)',
    permissions: [
      { key: 'VIEW_SELLER_DASHBOARD', label: 'সেলার ড্যাশবোর্ড প্রবেশাধিকার' },
      { key: 'MANAGE_OWN_PRODUCTS', label: 'নিজস্ব পণ্য তৈরি ও স্টক আপডেট' },
      { key: 'MANAGE_OWN_ORDERS', label: 'নিজস্ব স্টোরের অর্ডার ফুলফিলমেন্ট' },
      { key: 'REQUEST_PAYOUT', label: 'উপার্জিত ব্যালেন্স তোলার আবেদন' },
      { key: 'VIEW_OWN_LEDGER', label: 'বিক্রয় লেজার ও স্টেটমেন্ট দেখা' },
    ],
  },
  {
    category: 'সম্পাদকীয় ও প্রকাশনা (Editorial & Publishing)',
    permissions: [
      { key: 'PUBLISH_BOOKS', label: 'বই প্রকাশ ও ক্যাটালগে যুক্তকরণ' },
      { key: 'PUBLISH_ARTICLES', label: 'প্রবন্ধ ও কলাম অনুমোদন' },
      { key: 'PUBLISH_MAGAZINES', label: 'ডিজিটাল ম্যাগাজিন ও সাময়িকী প্রকাশ' },
      { key: 'MODERATE_QUESTIONS', label: 'প্রশ্নোত্তর সেকশন মডারেশন' },
      { key: 'MODERATE_REVIEWS', label: 'বই রিভিউ ও মতামত মডারেশন' },
    ],
  },
  {
    category: 'দান ও সামাজিক তহবিল (Donation & Welfare)',
    permissions: [
      { key: 'MANAGE_DONATION_CAMPAIGNS', label: 'দাতব্য ক্যাম্পেইন পরিচালনা' },
      { key: 'AUDIT_DONATIONS', label: 'দান ও তহবিল অডিট নিরীক্ষা' },
    ],
  },
  {
    category: 'পাঠক ও গ্রাহক সুবিধা (Reader & Customer)',
    permissions: [
      { key: 'READ_FREE_BOOKS', label: 'উন্মুক্ত ফ্রি বই পাঠ' },
      { key: 'READ_PREMIUM_BOOKS', label: 'প্রিমিয়াম স্কলার বই পাঠ' },
      { key: 'DOWNLOAD_EBOOK', label: 'ডিজিটাল কপি ডাউনলোড' },
      { key: 'SUBMIT_ORDER', label: 'অর্ডার প্রদান ও চেকআউট' },
      { key: 'POST_QUESTION', label: 'প্রশ্নোত্তর ফোরামে প্রশ্ন করা' },
      { key: 'POST_REVIEW', label: 'বইয়ের রেটিং ও রিভিউ প্রদান' },
    ],
  },
];

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস। শুধুমাত্র অ্যাডমিনদের জন্য।' }, { status: 403 });
    }

    // Fetch user counts grouped by role
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const countsMap: Record<string, number> = {};
    for (const c of counts) {
      countsMap[c.role] = c._count.id;
    }

    const currentPermissionsMap = await getDynamicRolePermissions();

    const roles = Object.keys(ROLE_LEVELS)
      .sort((a, b) => (ROLE_LEVELS[b] || 0) - (ROLE_LEVELS[a] || 0))
      .map((roleKey) => {
        const meta = ROLE_METADATA[roleKey] || {
          name: roleKey,
          description: 'সিস্টেম নির্ধারিত ভূমিকা।',
        };

        return {
          role: roleKey,
          name: meta.name,
          description: meta.description,
          level: ROLE_LEVELS[roleKey] || 0,
          userCount: countsMap[roleKey] || 0,
          permissions: currentPermissionsMap[roleKey] || ROLE_PERMISSIONS[roleKey] || [],
          isProtected: !!meta.isProtected,
        };
      });

    return NextResponse.json({
      success: true,
      roles,
      permissionGroups: PERMISSION_GROUPS,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'রোল তালিকা লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isSuperAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। শুধুমাত্র সুপার অ্যাডমিন রোল পারমিশন পরিবর্তন করতে পারেন।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role, permissions, description } = body;

    if (!role || !ROLE_LEVELS[role]) {
      return NextResponse.json({ error: 'অবৈধ রোল নির্বাচন করা হয়েছে।' }, { status: 400 });
    }

    if (role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'সুপার অ্যাডমিনের পারমিশন সীমাবদ্ধ বা অপসারণ করা নিষিদ্ধ।' },
        { status: 400 }
      );
    }

    const currentMap = await getDynamicRolePermissions();

    if (Array.isArray(permissions)) {
      currentMap[role] = permissions as Permission[];
    }

    await saveDynamicRolePermissions(currentMap);

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'ROLE_PERMISSIONS_UPDATED',
          entity: 'Role',
          entityId: role,
          details: JSON.stringify({
            role,
            assignedPermissionsCount: currentMap[role]?.length || 0,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `রোল "${role}" এর অনুমতি সফলভাবে হালনাগাদ করা হয়েছে!`,
      role,
      permissions: currentMap[role],
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'রোল পারমিশন সংরক্ষণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isSuperAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। শুধুমাত্র সুপার অ্যাডমিন ভূমিকা রিসেট করতে পারেন।' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryRole = searchParams.get('role');
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const role = queryRole || body.role;

    if (!role || !ROLE_LEVELS[role]) {
      return NextResponse.json({ error: 'অবৈধ ভূমিকা নির্বাচন করা হয়েছে।' }, { status: 400 });
    }

    if (role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'সুপার অ্যাডমিনের অনুমতি পরিবর্তন বা রিসেট করা নিষিদ্ধ।' },
        { status: 400 }
      );
    }

    const currentMap = await getDynamicRolePermissions();
    // Delete override so it falls back to ROLE_PERMISSIONS[role]
    delete currentMap[role];
    await saveDynamicRolePermissions(currentMap);

    const defaultPerms = ROLE_PERMISSIONS[role] || [];

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'ROLE_PERMISSIONS_RESET',
          entity: 'Role',
          entityId: role,
          details: JSON.stringify({
            role,
            restoredDefaultPermissionsCount: defaultPerms.length,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `রোল "${role}" এর অনুমতি সফলভাবে সিস্টেম ডিফল্ট মানে ফিরিয়ে নেওয়া হয়েছে!`,
      role,
      permissions: defaultPerms,
    });
  } catch (error: any) {
    console.error('Error resetting role permissions:', error);
    return NextResponse.json({ error: 'রোল পারমিশন রিসেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}



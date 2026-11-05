import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { action, ids = [] } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'অ্যাকশন নির্ধারণ করুন।' }, { status: 400 });
    }

    if (action === 'export') {
      const attributes = await prisma.productAttribute.findMany({
        where: ids.length > 0 ? { id: { in: ids } } : undefined,
        orderBy: { displayOrder: 'asc' },
        include: {
          group: true,
          values: true,
          _count: { select: { assignments: true, values: true } },
        },
      });

      // Format CSV rows
      const header = ['ID', 'Name', 'Code', 'Slug', 'Type', 'Group', 'Values', 'Product Usage', 'Status', 'Created At'];
      const rows = attributes.map((attr) => [
        attr.id,
        `"${(attr.name || '').replace(/"/g, '""')}"`,
        attr.code,
        attr.slug,
        attr.type,
        `"${(attr.group?.name || 'None').replace(/"/g, '""')}"`,
        `"${attr.values.map((v) => v.name).join(', ').replace(/"/g, '""')}"`,
        attr._count.assignments,
        attr.status,
        new Date(attr.createdAt).toISOString(),
      ]);

      const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="shubban-attributes-export-${Date.now()}.csv"`,
        },
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'অন্তত একটি অ্যাট্রিবিউট নির্বাচন করুন।' }, { status: 400 });
    }

    if (action === 'activate') {
      await prisma.productAttribute.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ACTIVE' },
      });
      return NextResponse.json({
        success: true,
        message: `${ids.length}টি অ্যাট্রিবিউট সক্রিয় করা হয়েছে।`,
      });
    }

    if (action === 'deactivate') {
      await prisma.productAttribute.updateMany({
        where: { id: { in: ids } },
        data: { status: 'INACTIVE' },
      });
      return NextResponse.json({
        success: true,
        message: `${ids.length}টি অ্যাট্রিবিউট নিষ্ক্রিয় করা হয়েছে।`,
      });
    }

    if (action === 'delete') {
      await prisma.productAttribute.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({
        success: true,
        message: `${ids.length}টি অ্যাট্রিবিউট সফলভাবে মুছে ফেলা হয়েছে।`,
      });
    }

    return NextResponse.json({ error: 'অজ্ঞাত অ্যাকশন।' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Attributes Bulk error:', error);
    return NextResponse.json({ error: error.message || 'বাল্ক অপারেশন সম্পন্ন করতে ব্যর্থ।' }, { status: 500 });
  }
}


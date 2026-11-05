import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const tags = await prisma.customerTag.findMany({
      orderBy: { name: 'asc' },
    });

    // Count customers per tag
    const allCustomers = await prisma.user.findMany({
      where: { customerTags: { not: null } },
      select: { customerTags: true },
    });

    const tagCounts: Record<string, number> = {};
    allCustomers.forEach((c) => {
      try {
        if (c.customerTags) {
          const parsed = JSON.parse(c.customerTags);
          if (Array.isArray(parsed)) {
            parsed.forEach((t) => {
              tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
          }
        }
      } catch {
        if (c.customerTags) {
          tagCounts[c.customerTags] = (tagCounts[c.customerTags] || 0) + 1;
        }
      }
    });

    const tagsWithCounts = tags.map((t) => ({
      ...t,
      count: tagCounts[t.name] || 0,
    }));

    return NextResponse.json({
      success: true,
      tags: tagsWithCounts,
    });
  } catch (error: any) {
    console.error('Customer tags GET error:', error);
    return NextResponse.json({ error: error.message || 'ট্যাগ লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { name, color = '#6B7280', description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'ট্যাগের নাম আবশ্যক।' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingTag = await prisma.customerTag.findFirst({
      where: {
        OR: [{ name: trimmedName }, { slug }],
      },
    });

    if (existingTag) {
      return NextResponse.json({ error: 'এই নামের ট্যাগ ইতিমধ্যে রয়েছে।' }, { status: 400 });
    }

    const tag = await prisma.customerTag.create({
      data: {
        name: trimmedName,
        slug,
        color: color.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ট্যাগ সফলভাবে তৈরি করা হয়েছে।',
      tag,
    });
  } catch (error: any) {
    console.error('Customer tag POST error:', error);
    return NextResponse.json({ error: error.message || 'ট্যাগ তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, color, description } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'ট্যাগ আইডি ও নাম আবশ্যক।' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const updatedTag = await prisma.customerTag.update({
      where: { id },
      data: {
        name: trimmedName,
        slug,
        color: color?.trim() || '#6B7280',
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ট্যাগ সফলভাবে আপডেট করা হয়েছে।',
      tag: updatedTag,
    });
  } catch (error: any) {
    console.error('Customer tag PUT error:', error);
    return NextResponse.json({ error: error.message || 'ট্যাগ আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ট্যাগ আইডি দেওয়া হয়নি।' }, { status: 400 });
    }

    await prisma.customerTag.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ট্যাগ সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Customer tag DELETE error:', error);
    return NextResponse.json({ error: error.message || 'ট্যাগ মুছতে ব্যর্থ।' }, { status: 500 });
  }
}


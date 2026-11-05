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

    const body = await req.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'কমপক্ষে একটি প্রকাশনী নির্বাচন করুন।' }, { status: 400 });
    }

    let affectedCount = 0;
    let skippedCount = 0;
    let skippedPublishers: string[] = [];

    switch (action) {
      case 'activate': {
        const result = await prisma.publisher.updateMany({
          where: { id: { in: ids } },
          data: { status: 'ACTIVE', isActive: true },
        });
        affectedCount = result.count;
        break;
      }

      case 'deactivate': {
        const result = await prisma.publisher.updateMany({
          where: { id: { in: ids } },
          data: { status: 'INACTIVE', isActive: false },
        });
        affectedCount = result.count;
        break;
      }

      case 'verify': {
        const result = await prisma.publisher.updateMany({
          where: { id: { in: ids } },
          data: { isVerified: true },
        });
        affectedCount = result.count;
        break;
      }

      case 'unverify': {
        const result = await prisma.publisher.updateMany({
          where: { id: { in: ids } },
          data: { isVerified: false },
        });
        affectedCount = result.count;
        break;
      }

      case 'feature': {
        const result = await prisma.publisher.updateMany({
          where: { id: { in: ids } },
          data: { isFeatured: true },
        });
        affectedCount = result.count;
        break;
      }

      case 'unfeature': {
        const result = await prisma.publisher.updateMany({
          where: { id: { in: ids } },
          data: { isFeatured: false },
        });
        affectedCount = result.count;
        break;
      }

      case 'delete': {
        // Safe batch deletion: inspect publications for each publisher
        const publishersToCheck = await prisma.publisher.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                books: true,
                magazines: true,
              },
            },
          },
        });

        const deletableIds: string[] = [];

        for (const pub of publishersToCheck) {
          const pubTotal = pub._count.books + pub._count.magazines;
          if (pubTotal > 0) {
            skippedCount++;
            skippedPublishers.push(pub.name);
          } else {
            deletableIds.push(pub.id);
          }
        }

        if (deletableIds.length > 0) {
          const deleteResult = await prisma.publisher.deleteMany({
            where: { id: { in: deletableIds } },
          });
          affectedCount = deleteResult.count;
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'অবৈধ ব্যাচ অ্যাকশন।' }, { status: 400 });
    }

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: `BATCH_${action.toUpperCase()}_PUBLISHERS`,
          entity: 'Publisher',
          entityId: 'multiple',
          details: JSON.stringify({
            action,
            targetCount: ids.length,
            affectedCount,
            skippedCount,
            skippedPublishers,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record batch audit log:', logErr);
    }

    let message = `${affectedCount}টি প্রকাশনী সফলভাবে আপডেট করা হয়েছে।`;
    if (action === 'delete') {
      if (skippedCount > 0) {
        message = `${affectedCount}টি প্রকাশনী মুছে ফেলা হয়েছে। ${skippedCount}টি প্রকাশনীতে সংযুক্ত বই/ম্যাগাজিন থাকায় নিরাপত্তা স্বার্থে বাদ রাখা হয়েছে (${skippedPublishers.slice(0, 3).join(', ')}${skippedPublishers.length > 3 ? '...' : ''})।`;
      } else {
        message = `${affectedCount}টি প্রকাশনী সফলভাবে মুছে ফেলা হয়েছে।`;
      }
    }

    return NextResponse.json({
      success: true,
      action,
      affectedCount,
      skippedCount,
      skippedPublishers,
      message,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/publishers/batch:', error);
    return NextResponse.json(
      { error: 'ব্যাচ অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}


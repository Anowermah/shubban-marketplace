import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin, isSuperAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। শুধুমাত্র অ্যাডমিনরা অডিট লগ দেখতে পারেন।' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('q')?.trim() || '';
    const actionFilter = searchParams.get('action')?.trim() || '';
    const entityFilter = searchParams.get('entity')?.trim() || '';

    const where: any = {};

    if (actionFilter) {
      where.action = actionFilter;
    }

    if (entityFilter) {
      where.entity = entityFilter;
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entity: { contains: search } },
        { entityId: { contains: search } },
        { details: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    // Unique actions and entities for filter dropdowns
    const distinctActions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      take: 50,
      orderBy: { action: 'asc' },
    });

    const distinctEntities = await prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ['entity'],
      take: 50,
      orderBy: { entity: 'asc' },
    });

    return NextResponse.json({
      success: true,
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      availableActions: distinctActions.map((a) => a.action),
      availableEntities: distinctEntities.map((e) => e.entity),
    });
  } catch (error: any) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'অডিট লগ লোড করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'অননুমোদিত অনুরোধ। শুধুমাত্র অ্যাডমিনরা অডিট লগ সংশোধন বা মুছতে পারেন।' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty if deleting via query param
    }

    const targetId = queryId || body.id;
    const targetIds = body.ids as string[] | undefined;
    const purgeOlderThanDays = body.purgeOlderThanDays as number | undefined;
    const purgeAll = body.purgeAll === true;

    // 1. Purge all logs (Super Admin only)
    if (purgeAll) {
      if (!isSuperAdmin(operator.role)) {
        return NextResponse.json(
          { error: 'শুধুমাত্র সুপার অ্যাডমিনিস্ট্রেটর সমস্ত অডিট লগ মুছে ফেলতে পারেন।' },
          { status: 403 }
        );
      }

      const deleted = await prisma.auditLog.deleteMany({});

      // Record this purge action as a new audit log
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'AUDIT_LOGS_PURGED_ALL',
          entity: 'AuditLog',
          details: JSON.stringify({
            deletedCount: deleted.count,
            operatorEmail: operator.email,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        message: `সকল (${deleted.count}টি) অডিট লগ সফলভাবে মুছে ফেলা হয়েছে!`,
        count: deleted.count,
      });
    }

    // 2. Purge logs older than X days
    if (typeof purgeOlderThanDays === 'number' && purgeOlderThanDays > 0) {
      if (!isSuperAdmin(operator.role)) {
        return NextResponse.json(
          { error: 'পুরনো অডিট লগ ছাঁটাই করার জন্য সুপার অ্যাডমিন অনুমতি প্রয়োজন।' },
          { status: 403 }
        );
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - purgeOlderThanDays);

      const deleted = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'AUDIT_LOGS_PURGED_OLD',
          entity: 'AuditLog',
          details: JSON.stringify({
            days: purgeOlderThanDays,
            cutoffDate: cutoffDate.toISOString(),
            deletedCount: deleted.count,
            operatorEmail: operator.email,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${purgeOlderThanDays} দিনের পূর্বের ${deleted.count}টি অডিট লগ সফলভাবে ছাঁটাই করা হয়েছে!`,
        count: deleted.count,
      });
    }

    // 3. Bulk delete by array of IDs
    if (Array.isArray(targetIds) && targetIds.length > 0) {
      const deleted = await prisma.auditLog.deleteMany({
        where: {
          id: {
            in: targetIds,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'AUDIT_LOGS_BULK_DELETED',
          entity: 'AuditLog',
          details: JSON.stringify({
            deletedCount: deleted.count,
            operatorEmail: operator.email,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        message: `নির্বাচিত ${deleted.count}টি অডিট লগ সফলভাবে মুছে ফেলা হয়েছে!`,
        count: deleted.count,
      });
    }

    // 4. Single log delete
    if (targetId) {
      const existing = await prisma.auditLog.findUnique({
        where: { id: targetId },
      });

      if (!existing) {
        return NextResponse.json({ error: 'উক্ত অডিট লগটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
      }

      await prisma.auditLog.delete({
        where: { id: targetId },
      });

      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'AUDIT_LOG_DELETED',
          entity: 'AuditLog',
          entityId: targetId,
          details: JSON.stringify({
            deletedAction: existing.action,
            deletedEntity: existing.entity,
            operatorEmail: operator.email,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'অডিট লগ রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!',
      });
    }

    return NextResponse.json(
      { error: 'মুছে ফেলার জন্য লগ আইডি বা ফিল্টার প্রদান করুন।' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Audit log delete error:', error);
    return NextResponse.json(
      { error: 'অডিট লগ মুছে ফেলতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}

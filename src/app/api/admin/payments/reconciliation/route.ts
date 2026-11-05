import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const [transactions, orders, refunds] = await Promise.all([
      prisma.paymentTransaction.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      prisma.refund.findMany({
        where: { status: 'PROCESSED' },
      }),
    ]);

    // 1. Group by Gateway & Status
    const gatewayBreakdown: Record<string, { count: number; totalAmount: number; successfulAmount: number }> = {};
    let totalGrossSuccess = 0;
    let totalInitiatedPending = 0;
    let totalFailedCancelled = 0;

    for (const t of transactions) {
      const gw = t.gateway.toUpperCase();
      if (!gatewayBreakdown[gw]) {
        gatewayBreakdown[gw] = { count: 0, totalAmount: 0, successfulAmount: 0 };
      }
      gatewayBreakdown[gw].count++;
      gatewayBreakdown[gw].totalAmount += t.amount;

      if (t.status === 'SUCCESS') {
        gatewayBreakdown[gw].successfulAmount += t.amount;
        totalGrossSuccess += t.amount;
      } else if (t.status === 'INITIATED') {
        totalInitiatedPending += t.amount;
      } else {
        totalFailedCancelled += t.amount;
      }
    }

    // 2. Refunds
    const totalRefunded = refunds.reduce((acc, r) => acc + r.amount, 0);
    const netRevenue = totalGrossSuccess - totalRefunded;

    // 3. Discrepancy Detection
    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const successfulTxnByOrderId = new Map<string, number>();

    for (const t of transactions) {
      if (t.status === 'SUCCESS' && t.orderId) {
        successfulTxnByOrderId.set(
          t.orderId,
          (successfulTxnByOrderId.get(t.orderId) || 0) + t.amount
        );
      }
    }

    const discrepancies: any[] = [];

    // Check for orders marked PAID without matching SUCCESS transaction
    for (const order of orders) {
      if (order.paymentStatus === 'PAID') {
        const txnAmount = successfulTxnByOrderId.get(order.id);
        if (txnAmount === undefined && order.paymentMethod !== 'cod') {
          discrepancies.push({
            type: 'MISSING_TRANSACTION',
            severity: 'HIGH',
            orderNumber: order.orderNumber,
            orderTotal: order.total,
            message: `অর্ডার #${order.orderNumber} ডাটাবেজে PAID চিহ্নিত রয়েছে কিন্তু কোনো সফল পেমেন্ট ট্রানজেকশন মেলেনি।`,
          });
        } else if (txnAmount !== undefined && Math.abs(txnAmount - order.total) > 1.0) {
          discrepancies.push({
            type: 'AMOUNT_MISMATCH',
            severity: 'MEDIUM',
            orderNumber: order.orderNumber,
            orderTotal: order.total,
            transactionTotal: txnAmount,
            message: `অর্ডার #${order.orderNumber} এর মূল্য (৳ ${order.total}) এবং গেটওয়ে সংগ্রহ (৳ ${txnAmount}) এ অমিল রয়েছে।`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        totalTransactions: transactions.length,
        totalGrossCollected: totalGrossSuccess,
        totalRefunded,
        netRevenue,
        pendingInitiatedAmount: totalInitiatedPending,
        failedCancelledAmount: totalFailedCancelled,
      },
      gatewayBreakdown,
      discrepancies: {
        count: discrepancies.length,
        isClean: discrepancies.length === 0,
        items: discrepancies,
      },
    });
  } catch (error: any) {
    console.error('Payment reconciliation error:', error);
    return NextResponse.json(
      { error: 'পেমেন্ট রিকনসিলিয়েশন প্রতিবেদন প্রস্তুত করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}


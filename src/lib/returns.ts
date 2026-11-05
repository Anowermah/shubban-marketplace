import { prisma } from './prisma';

export interface ReturnItemInput {
  bookId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
}

/**
 * Step 1: Customer or Support initiates a return request for an order/sub-order.
 */
export async function createReturnRequest(params: {
  orderId: string;
  subOrderId?: string | null;
  userId: string;
  reason:
    | 'DEFECTIVE_PRINTING'
    | 'WRONG_ITEM'
    | 'DAMAGED_IN_TRANSIT'
    | 'CHANGED_MIND'
    | 'MISSING_PAGES';
  explanation?: string;
  items: ReturnItemInput[];
  customerImages?: string[];
}) {
  const { orderId, subOrderId, userId, reason, explanation, items, customerImages } = params;

  if (!items || items.length === 0) {
    throw new Error('অন্তত একটি বই বা পণ্য রিটার্নের জন্য নির্বাচন করুন।');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('অর্ডার পাওয়া যায়নি।');
  }

  // Ensure order is DELIVERED
  if (order.orderStatus !== 'DELIVERED') {
    throw new Error('কেবলমাত্র সফলভাবে ডেলিভারিকৃত অর্ডারে রিটার্ন আবেদন করা যায়।');
  }

  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const returnNumber = `RTN-${new Date().getFullYear()}-${randomDigits}`;

  return await prisma.$transaction(async (tx) => {
    const returnRequest = await tx.returnRequest.create({
      data: {
        returnNumber,
        orderId,
        subOrderId: subOrderId || null,
        userId,
        status: 'REQUESTED',
        reason,
        explanation: explanation || null,
        customerImages: customerImages ? JSON.stringify(customerImages) : null,
        items: {
          create: items.map((it) => ({
            bookId: it.bookId,
            variantId: it.variantId || null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.unitPrice * it.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'RETURN_REQUESTED',
        entity: 'ReturnRequest',
        entityId: returnRequest.id,
        details: JSON.stringify({
          returnNumber,
          orderId,
          reason,
          itemCount: items.length,
        }),
      },
    });

    return returnRequest;
  });
}

/**
 * Step 2: Admin or Return Manager approves the return request.
 */
export async function approveReturnRequest(params: {
  returnRequestId: string;
  adminUserId: string;
  notes?: string;
}) {
  const { returnRequestId, adminUserId, notes } = params;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
  });

  if (!returnReq) {
    throw new Error('রিটার্ন আবেদনটি পাওয়া যায়নি।');
  }

  if (returnReq.status !== 'REQUESTED') {
    throw new Error(`রিটার্ন আবেদনটি ${returnReq.status} স্ট্যাটাসে রয়েছে। অনুমোদন সম্ভব নয়।`);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: 'APPROVED',
        approvedBy: adminUserId,
        approvedAt: new Date(),
        explanation: notes
          ? `${returnReq.explanation ? returnReq.explanation + ' | ' : ''}অ্যাডমিন নোট: ${notes}`
          : returnReq.explanation,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'RETURN_APPROVED',
        entity: 'ReturnRequest',
        entityId: returnReq.id,
        details: JSON.stringify({
          returnNumber: returnReq.returnNumber,
          approvedBy: adminUserId,
        }),
      },
    });

    return updated;
  });
}

/**
 * Step 2b: Admin rejects the return request with reason.
 */
export async function rejectReturnRequest(params: {
  returnRequestId: string;
  adminUserId: string;
  reason: string;
}) {
  const { returnRequestId, adminUserId, reason } = params;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
  });

  if (!returnReq) {
    throw new Error('রিটার্ন আবেদনটি পাওয়া যায়নি।');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: 'REJECTED',
        explanation: reason,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'RETURN_REJECTED',
        entity: 'ReturnRequest',
        entityId: returnReq.id,
        details: JSON.stringify({
          returnNumber: returnReq.returnNumber,
          reason,
        }),
      },
    });

    return updated;
  });
}

/**
 * Step 3: Logistics or Quality Inspector inspects the returned physical product.
 * Result: 'RESELLABLE' (intact) or 'DAMAGED' (cannot be resold).
 */
export async function inspectReturnProduct(params: {
  returnRequestId: string;
  inspectorUserId: string;
  result: 'RESELLABLE' | 'DAMAGED' | 'REJECTED';
  notes: string;
}) {
  const { returnRequestId, inspectorUserId, result, notes } = params;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
  });

  if (!returnReq) {
    throw new Error('রিটার্ন আবেদন পাওয়া যায়নি।');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: 'INSPECTED',
        inspectionResult: result,
        inspectionNotes: notes,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: inspectorUserId,
        action: 'RETURN_INSPECTED',
        entity: 'ReturnRequest',
        entityId: returnReq.id,
        details: JSON.stringify({
          returnNumber: returnReq.returnNumber,
          result,
          notes,
        }),
      },
    });

    return updated;
  });
}

/**
 * Step 4: Calculates refund, processes payment refund record, restocks inventory (if intact),
 * and updates vendor financial ledger.
 * Supports partial refunds and custom deductions (e.g. return courier fees).
 */
export async function processReturnRefundAndRestock(params: {
  returnRequestId: string;
  adminUserId: string;
  refundDeduction?: number;
  adminNote?: string;
}) {
  const { returnRequestId, adminUserId, refundDeduction = 0, adminNote } = params;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: {
      items: true,
      order: true,
      subOrder: true,
    },
  });

  if (!returnReq) {
    throw new Error('রিটার্ন আবেদন পাওয়া যায়নি।');
  }

  if (returnReq.status === 'REFUNDED') {
    throw new Error('এই রিটার্নের রিফান্ড ইতোমধ্যে প্রসেস করা হয়েছে।');
  }

  // Calculate item sum
  const itemsSum = returnReq.items.reduce((acc, it) => acc + it.totalPrice, 0);
  const finalRefundAmount = Math.max(0, Math.round((itemsSum - refundDeduction) * 100) / 100);

  const refundTxnId = `RFD-RTN-${returnReq.returnNumber}-${Date.now().toString().slice(-4)}`;

  return await prisma.$transaction(async (tx) => {
    // 1. Create official Refund record
    const refund = await tx.refund.create({
      data: {
        orderId: returnReq.orderId,
        amount: finalRefundAmount,
        reason: `রিটার্ন #${returnReq.returnNumber} বাবদ রিফান্ড (${returnReq.reason})`,
        status: 'PROCESSED',
        refundTxnId,
        adminNote: adminNote || `কর্তন: ৳ ${refundDeduction}`,
        processedAt: new Date(),
      },
    });

    // 2. Inventory Adjustment
    const isResellable = returnReq.inspectionResult === 'RESELLABLE';
    for (const item of returnReq.items) {
      if (isResellable) {
        // Increment book stock
        const book = await tx.book.update({
          where: { id: item.bookId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });
        }

        // Record restock inventory log
        await tx.inventoryLog.create({
          data: {
            bookId: item.bookId,
            variantId: item.variantId || null,
            vendorId: returnReq.subOrder?.vendorId || null,
            changeType: 'RETURN',
            quantityChange: item.quantity,
            balanceAfter: book.stockQuantity,
            referenceId: returnReq.returnNumber,
            reason: `রিটার্ন #${returnReq.returnNumber} পণ্য অক্ষত থাকায় পুনরায় ইনভেন্টরিতে রিস্টক`,
          },
        });

        await tx.returnItem.update({
          where: { id: item.id },
          data: { restocked: true, condition: 'INTACT' },
        });
      } else {
        // Damaged / defective write-off
        const book = await tx.book.findUnique({ where: { id: item.bookId } });
        await tx.inventoryLog.create({
          data: {
            bookId: item.bookId,
            variantId: item.variantId || null,
            vendorId: returnReq.subOrder?.vendorId || null,
            changeType: 'DAMAGE_WRITE_OFF',
            quantityChange: -item.quantity,
            balanceAfter: book ? book.stockQuantity : 0,
            referenceId: returnReq.returnNumber,
            reason: `রিটার্ন #${returnReq.returnNumber} পণ্য নষ্ট থাকায় অবলোপন (Write-off)`,
          },
        });

        await tx.returnItem.update({
          where: { id: item.id },
          data: { restocked: false, condition: 'DAMAGED' },
        });
      }
    }

    // 3. Multi-Vendor Financial Ledger Settlement
    if (returnReq.subOrder) {
      const vendorId = returnReq.subOrder.vendorId;
      const commissionRate = returnReq.subOrder.commissionRate || 10.0;
      const commissionRefund = Math.round(((finalRefundAmount * commissionRate) / 100) * 100) / 100;
      const netVendorDebit = Math.round((finalRefundAmount - commissionRefund) * 100) / 100;

      // Recalculate balanceAfter
      const subOrdersAgg = await tx.subOrder.aggregate({
        where: { vendorId },
        _sum: { payoutAmt: true },
      });
      const payouts = await tx.sellerPayout.findMany({
        where: {
          vendorId,
          status: { in: ['PAID', 'PROCESSING', 'REQUESTED', 'APPROVED'] },
        },
      });
      const totalEarned = subOrdersAgg._sum.payoutAmt || 0;
      const committed = payouts.reduce((acc, p) => acc + p.amount, 0);
      const balanceAfter = Math.max(0, Math.round((totalEarned - committed - netVendorDebit) * 100) / 100);

      // Debit vendor for returned goods
      await tx.sellerLedgerEntry.create({
        data: {
          vendorId,
          subOrderId: returnReq.subOrder.id,
          type: 'REFUND_DEBIT',
          amount: -finalRefundAmount,
          balanceAfter,
          description: `গ্রাহক রিটার্ন #${returnReq.returnNumber} বাবদ পণ্যমূল্য ডেবিট`,
        },
      });

      // Credit platform commission back to vendor (Fairness Rule)
      await tx.sellerLedgerEntry.create({
        data: {
          vendorId,
          subOrderId: returnReq.subOrder.id,
          type: 'COMMISSION_REFUND_CREDIT',
          amount: commissionRefund,
          balanceAfter: balanceAfter + commissionRefund,
          description: `রিটার্ন #${returnReq.returnNumber} বাবদ কর্তিত প্ল্যাটফর্ম কমিশন (${commissionRate}%) ফেরত ক্রেডিট`,
        },
      });
    }

    // 4. Update ReturnRequest Status
    const updatedReturnReq = await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: 'REFUNDED',
        refundAmount: finalRefundAmount,
        refundStatus: 'PROCESSED',
        refundTxnId,
        refundId: refund.id,
        restocked: isResellable,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'RETURN_REFUNDED_AND_RESTOCKED',
        entity: 'ReturnRequest',
        entityId: returnReq.id,
        details: JSON.stringify({
          returnNumber: returnReq.returnNumber,
          refundAmount: finalRefundAmount,
          refundTxnId,
          restocked: isResellable,
        }),
      },
    });

    return {
      returnRequest: updatedReturnReq,
      refund,
      restocked: isResellable,
      refundAmount: finalRefundAmount,
    };
  });
}

/**
 * Step 5: Creates a dispute if vendor or customer disagrees with return decision.
 */
export async function raiseReturnDispute(params: {
  returnRequestId: string;
  raisedByRole: 'VENDOR' | 'CUSTOMER';
  raisedByUserId: string;
  reason: string;
}) {
  const { returnRequestId, raisedByRole, raisedByUserId, reason } = params;

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
  });

  if (!returnReq) {
    throw new Error('রিটার্ন আবেদন পাওয়া যায়নি।');
  }

  const disputeNumber = `DSP-${Date.now().toString().slice(-6)}`;

  return await prisma.$transaction(async (tx) => {
    const dispute = await tx.returnDispute.create({
      data: {
        disputeNumber,
        returnRequestId,
        raisedByRole,
        raisedByUserId,
        reason,
        status: 'OPEN',
      },
    });

    await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: 'DISPUTED' },
    });

    await tx.auditLog.create({
      data: {
        userId: raisedByUserId,
        action: 'RETURN_DISPUTE_RAISED',
        entity: 'ReturnDispute',
        entityId: dispute.id,
        details: JSON.stringify({
          disputeNumber,
          returnNumber: returnReq.returnNumber,
          raisedByRole,
          reason,
        }),
      },
    });

    return dispute;
  });
}

/**
 * Resolves a return dispute with admin arbitration.
 */
export async function resolveReturnDispute(params: {
  disputeId: string;
  adminUserId: string;
  resolution: 'RESOLVED_CUSTOMER_FAVOR' | 'RESOLVED_VENDOR_FAVOR' | 'REJECTED';
  notes: string;
}) {
  const { disputeId, adminUserId, resolution, notes } = params;

  const dispute = await prisma.returnDispute.findUnique({
    where: { id: disputeId },
    include: { returnRequest: true },
  });

  if (!dispute) {
    throw new Error('ডিসপ্যুট রেকর্ড পাওয়া যায়নি।');
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.returnDispute.update({
      where: { id: disputeId },
      data: {
        status: resolution,
        resolutionNotes: notes,
        resolvedBy: adminUserId,
        resolvedAt: new Date(),
      },
    });

    await tx.returnRequest.update({
      where: { id: dispute.returnRequestId },
      data: {
        status: resolution === 'RESOLVED_CUSTOMER_FAVOR' ? 'APPROVED' : 'CLOSED',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'RETURN_DISPUTE_RESOLVED',
        entity: 'ReturnDispute',
        entityId: dispute.id,
        details: JSON.stringify({
          disputeNumber: dispute.disputeNumber,
          resolution,
          notes,
        }),
      },
    });

    return updated;
  });
}


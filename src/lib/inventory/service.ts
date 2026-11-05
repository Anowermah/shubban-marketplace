import { prisma } from '@/lib/prisma';

export interface InventoryItemRequest {
  bookId: string;
  variantId?: string | null;
  quantity: number;
  type?: string; // 'PHYSICAL' | 'DIGITAL'
}

/**
 * 1. Stock Reservation
 * Holds inventory for online checkout sessions (e.g. SSLCommerz/bKash)
 * to prevent concurrent overselling during the payment window.
 */
export async function reserveStock(
  orderId: string,
  items: InventoryItemRequest[],
  holdMinutes: number = 20,
  txClient?: any
) {
  const db = txClient || prisma;
  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

  const physicalItems = items.filter((i) => (i.type || 'PHYSICAL') === 'PHYSICAL');
  if (physicalItems.length === 0) return [];

  const createdReservations = [];

  for (const item of physicalItems) {
    const book = await db.book.findUnique({
      where: { id: item.bookId },
      include: { variants: true },
    });

    if (!book) {
      throw new Error(`বই আইডি (${item.bookId}) ডাটাবেজে পাওয়া যায়নি।`);
    }

    // Check variant stock if specified
    if (item.variantId) {
      const variant = book.variants.find((v: any) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`ভ্যারিয়েন্ট আইডি (${item.variantId}) পাওয়া যায়নি।`);
      }

      // Sum active reservations for this variant
      const activeResAgg = await db.stockReservation.aggregate({
        where: {
          variantId: item.variantId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          orderId: { not: orderId },
        },
        _sum: { quantity: true },
      });

      const reservedQty = activeResAgg._sum.quantity || 0;
      const availableQty = variant.stockQuantity - reservedQty;

      if (availableQty < item.quantity) {
        throw new Error(
          `"${book.title} (${variant.name})" এর পর্যাপ্ত স্টক নেই। বিদ্যমান স্টক: ${availableQty} টি, আপনার অনুরোধ: ${item.quantity} টি।`
        );
      }
    } else {
      // Sum active reservations for this book
      const activeResAgg = await db.stockReservation.aggregate({
        where: {
          bookId: item.bookId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          orderId: { not: orderId },
        },
        _sum: { quantity: true },
      });

      const reservedQty = activeResAgg._sum.quantity || 0;
      const availableQty = book.stockQuantity - reservedQty;

      if (availableQty < item.quantity) {
        throw new Error(
          `"${book.title}" এর পর্যাপ্ত স্টক নেই। বিদ্যমান ফ্রি স্টক: ${availableQty} টি, আপনার অনুরোধ: ${item.quantity} টি।`
        );
      }
    }

    // Create reservation record
    const reservation = await db.stockReservation.create({
      data: {
        orderId,
        bookId: item.bookId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        status: 'ACTIVE',
        expiresAt,
      },
    });

    createdReservations.push(reservation);
  }

  return createdReservations;
}

/**
 * 2. Stock Fulfillment
 * Atomically decrements database stock and marks reservations as fulfilled.
 */
export async function fulfillStock(
  orderId: string,
  items: InventoryItemRequest[],
  referenceId: string,
  txClient?: any
) {
  const db = txClient || prisma;
  const physicalItems = items.filter((i) => (i.type || 'PHYSICAL') === 'PHYSICAL');

  for (const item of physicalItems) {
    // If variant exists, decrement variant stock
    if (item.variantId) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });
    }

    // Decrement main book stock
    const updatedBook = await db.book.update({
      where: { id: item.bookId },
      data: {
        stockQuantity: { decrement: item.quantity },
      },
    });

    // Record inventory audit log
    await db.inventoryLog.create({
      data: {
        bookId: item.bookId,
        variantId: item.variantId || null,
        changeType: 'ORDER_FULFILLMENT',
        quantityChange: -item.quantity,
        balanceAfter: updatedBook.stockQuantity,
        referenceId,
        reason: `অর্ডার #${referenceId} বাবদ ইনভেন্টরি কর্তন`,
      },
    });
  }

  // Update reservations to FULFILLED
  await db.stockReservation.updateMany({
    where: { orderId, status: 'ACTIVE' },
    data: { status: 'FULFILLED' },
  });
}

/**
 * 3. Stock Release (Cancellation / Return / Expiry)
 * Restores inventory back into the database and audits the action.
 */
export async function releaseStock(
  orderId: string,
  reason: string = 'অর্ডার বাতিল বা রিফান্ড বাবদ স্টক পুনরুদ্ধার',
  txClient?: any
) {
  const db = txClient || prisma;

  // Fetch order with items
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  const physicalItems = order.items.filter((i: any) => i.type === 'PHYSICAL');

  for (const item of physicalItems) {
    if (item.variantId) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockQuantity: { increment: item.quantity },
        },
      });
    }

    const updatedBook = await db.book.update({
      where: { id: item.bookId },
      data: {
        stockQuantity: { increment: item.quantity },
      },
    });

    await db.inventoryLog.create({
      data: {
        bookId: item.bookId,
        variantId: item.variantId || null,
        changeType: 'ORDER_CANCELLATION_RESTOCK',
        quantityChange: item.quantity,
        balanceAfter: updatedBook.stockQuantity,
        referenceId: order.orderNumber,
        reason: `অর্ডার #${order.orderNumber} বাতিল: ${reason}`,
      },
    });
  }

  // Mark all active reservations for this order as RELEASED
  await db.stockReservation.updateMany({
    where: { orderId, status: { in: ['ACTIVE', 'FULFILLED'] } },
    data: { status: 'RELEASED' },
  });
}

/**
 * 4. Cleanup Expired Stock Reservations
 */
export async function cleanupExpiredReservations() {
  const now = new Date();
  const expired = await prisma.stockReservation.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return expired.count;
}

/**
 * 5. Manual Inventory Adjustment (Restock, Damage Write-off, Count Corrections)
 */
export async function adjustInventory(
  bookId: string,
  variantId: string | null | undefined,
  quantityChange: number,
  changeType: 'RESTOCK' | 'DAMAGE_WRITE_OFF' | 'MANUAL_ADJUSTMENT' | 'RETURN',
  reason: string,
  txClient?: any
) {
  const db = txClient || prisma;

  if (variantId) {
    await db.productVariant.update({
      where: { id: variantId },
      data: {
        stockQuantity: { increment: quantityChange },
      },
    });
  }

  const updatedBook = await db.book.update({
    where: { id: bookId },
    data: {
      stockQuantity: { increment: quantityChange },
    },
  });

  const log = await db.inventoryLog.create({
    data: {
      bookId,
      variantId: variantId || null,
      changeType,
      quantityChange,
      balanceAfter: updatedBook.stockQuantity,
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      reason,
    },
  });

  return { updatedBook, log };
}

/**
 * 6. Low Stock Query
 */
export async function getLowStockAlerts(threshold: number = 5) {
  return await prisma.book.findMany({
    where: {
      stockQuantity: { lte: threshold },
    },
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      variants: {
        where: { stockQuantity: { lte: threshold } },
      },
    },
    orderBy: { stockQuantity: 'asc' },
  });
}


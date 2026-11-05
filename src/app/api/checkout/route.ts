import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const body = await req.json();

    const {
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingZone = 'DHAKA_METRO',
      paymentMethod = 'cod',
      transactionId,
      couponCode,
      isGiftWrapped,
      giftMessage,
      saveAddress,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'আপনার কার্টে কোনো বই বা পণ্য নেই।' }, { status: 400 });
    }

    const sName = (shippingName || body.customerName || body.name || session?.name || 'সম্মানিত পাঠক').trim();
    const sPhone = (shippingPhone || body.customerPhone || body.phone || '').trim();
    const sAddress = (shippingAddress || body.address || '').trim();
    const sCity = (shippingCity || body.city || 'ঢাকা').trim();
    const sMethod = (paymentMethod || 'cod').toLowerCase();

    // Determine target user
    let userId = session?.id;
    if (!userId) {
      const guestEmail = body.customerEmail || body.email || `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}@shubban.com`;
      const guest = await prisma.user.create({
        data: {
          email: guestEmail,
          passwordHash: 'guest_no_login_hash',
          name: sName,
          phone: sPhone || '01700000000',
          role: 'GUEST',
          membershipTier: 'FREE',
        },
      });
      userId = guest.id;
    }

    // -------------------------------------------------------------------------
    // 1. RECALCULATE PRICES & VERIFY STOCK STRICTLY FROM DATABASE (ZERO TRUST)
    // -------------------------------------------------------------------------
    interface VerifiedItem {
      bookId: string;
      variantId?: string | null;
      type: 'PHYSICAL' | 'DIGITAL';
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      title: string;
      coverImage: string;
      vendorId: string;
    }

    const verifiedItems: VerifiedItem[] = [];
    let serverSubtotal = 0;
    let hasPhysical = false;

    // Default vendor fallback for items without explicit vendor
    const defaultVendor = await prisma.vendor.findFirst({
      where: { slug: 'shubban-official' },
    }) || await prisma.vendor.findFirst();

    for (const item of items) {
      const bookId = item.id || item.bookId;
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));

      if (!bookId) {
        return NextResponse.json({ error: 'আইটেমের বই শনাক্তকারী আইডি পাওয়া যায়নি।' }, { status: 400 });
      }

      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          vendor: true,
          variants: true,
        },
      });

      if (!book) {
        return NextResponse.json(
          { error: `বই আইডি (${bookId}) ডাটাবেজে পাওয়া যায়নি।` },
          { status: 404 }
        );
      }

      const itemType = (item.type || 'PHYSICAL').toUpperCase() === 'DIGITAL' ? 'DIGITAL' : 'PHYSICAL';
      if (itemType === 'PHYSICAL') {
        hasPhysical = true;
      }

      let unitPrice = book.discountPrice !== null && book.discountPrice !== undefined
        ? Number(book.discountPrice)
        : Number(book.price);

      // Check variant if provided
      let matchedVariant = null;
      if (item.variantId) {
        matchedVariant = book.variants.find((v) => v.id === item.variantId);
        if (matchedVariant) {
          unitPrice = Number(matchedVariant.price);
          // Stock verification for variant
          if (itemType === 'PHYSICAL' && matchedVariant.stockQuantity < quantity) {
            return NextResponse.json(
              {
                error: `"${book.title} (${matchedVariant.name})" এর পর্যাপ্ত স্টক নেই। বিদ্যমান স্টক: ${matchedVariant.stockQuantity} টি, আপনার অনুরোধ: ${quantity} টি।`,
              },
              { status: 400 }
            );
          }
        }
      }

      // Stock verification for book-level inventory
      if (itemType === 'PHYSICAL' && !matchedVariant && book.stockQuantity < quantity) {
        return NextResponse.json(
          {
            error: `"${book.title}" এর পর্যাপ্ত স্টক নেই। বিদ্যমান স্টক: ${book.stockQuantity} টি, আপনার অনুরোধ: ${quantity} টি।`,
          },
          { status: 400 }
        );
      }

      const lineTotal = unitPrice * quantity;
      serverSubtotal += lineTotal;

      const vId = book.vendorId || defaultVendor?.id || 'default-vendor';

      verifiedItems.push({
        bookId: book.id,
        variantId: matchedVariant ? matchedVariant.id : null,
        type: itemType,
        quantity,
        unitPrice,
        totalPrice: lineTotal,
        title: matchedVariant ? `${book.title} (${matchedVariant.name})` : book.title,
        coverImage: book.coverImage || '/placeholder.jpg',
        vendorId: vId,
      });
    }

    // Require address info for physical orders
    if (hasPhysical && (!sName || !sPhone || !sAddress)) {
      return NextResponse.json(
        { error: 'মুদ্রিত বইয়ের হোম ডেলিভারির জন্য গ্রাহকের পূর্ণ নাম, ফোন নম্বর ও সম্পূর্ণ ঠিকানা আবশ্যক।' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. SERVER-SIDE COUPON VERIFICATION (ZERO TRUST ON CLIENT DISCOUNT)
    // -------------------------------------------------------------------------
    let serverDiscount = 0;
    let validCouponId: string | null = null;

    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (dbCoupon && dbCoupon.isActive) {
        const isNotExpired = !dbCoupon.expiresAt || new Date() <= new Date(dbCoupon.expiresAt);
        const isUnderMaxUsage = !dbCoupon.maxUsage || dbCoupon.usedCount < dbCoupon.maxUsage;
        const meetsMinAmount = !dbCoupon.minAmount || serverSubtotal >= dbCoupon.minAmount;

        if (isNotExpired && isUnderMaxUsage && meetsMinAmount) {
          validCouponId = dbCoupon.id;
          if (dbCoupon.discountPct) {
            serverDiscount = Math.round((serverSubtotal * dbCoupon.discountPct) / 100);
          } else if (dbCoupon.discountAmt) {
            serverDiscount = Math.min(serverSubtotal, dbCoupon.discountAmt);
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. SERVER-SIDE SHIPPING FEE CALCULATION
    // -------------------------------------------------------------------------
    let serverShipping = 0;
    if (hasPhysical) {
      if (serverSubtotal >= 1500) {
        serverShipping = 0; // Free delivery threshold
      } else {
        const normalizedZone = (shippingZone || '').toUpperCase();
        if (normalizedZone === 'OUTSIDE_DHAKA') {
          serverShipping = 110;
        } else if (normalizedZone === 'EXPRESS') {
          serverShipping = 130;
        } else {
          serverShipping = 60; // Dhaka Metro standard
        }
      }
    }

    // -------------------------------------------------------------------------
    // 4. GIFT WRAP CALCULATION
    // -------------------------------------------------------------------------
    const serverGiftWrap = isGiftWrapped ? 30 : 0;

    // -------------------------------------------------------------------------
    // 5. SERVER GRAND TOTAL CALCULATION
    // -------------------------------------------------------------------------
    const serverTotal = Math.max(0, serverSubtotal + serverShipping + serverGiftWrap - serverDiscount);

    // -------------------------------------------------------------------------
    // 6. IDEMPOTENCY / DUPLICATE ORDER PREVENTION
    // -------------------------------------------------------------------------
    const duplicateWindowMs = 15000; // 15 seconds
    const recentDuplicate = await prisma.order.findFirst({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - duplicateWindowMs) },
        total: serverTotal,
        shippingPhone: sPhone,
      },
    });

    if (recentDuplicate) {
      return NextResponse.json({
        success: true,
        orderNumber: recentDuplicate.orderNumber,
        orderId: recentDuplicate.id,
        isDuplicate: true,
        message: 'একই অর্ডারের পুনরাবৃত্তি প্রতিরোধ করা হয়েছে। আপনার পূর্বের অর্ডারটি সফল রয়েছে।',
      });
    }

    // -------------------------------------------------------------------------
    // 7. AUTO-SAVE ADDRESS TO ADDRESS BOOK IF REQUESTED
    // -------------------------------------------------------------------------
    if (saveAddress && userId && hasPhysical && sAddress) {
      try {
        const existingAddress = await prisma.address.findFirst({
          where: {
            userId,
            address: sAddress,
            phone: sPhone,
          },
        });

        if (!existingAddress) {
          const userAddressesCount = await prisma.address.count({ where: { userId } });
          await prisma.address.create({
            data: {
              userId,
              title: sCity.includes('ঢাকা') ? 'বাসা (ঢাকা)' : 'ডেলিভারি ঠিকানা',
              name: sName,
              phone: sPhone,
              address: sAddress,
              city: sCity,
              zone: shippingZone === 'OUTSIDE_DHAKA' ? 'OUTSIDE_DHAKA' : 'DHAKA_METRO',
              isDefault: userAddressesCount === 0,
            },
          });
        }
      } catch (err) {
        console.error('Auto-save address error:', err);
      }
    }

    // -------------------------------------------------------------------------
    // 8. GENERATE ORDER NUMBER & PAYMENT STATUS
    // -------------------------------------------------------------------------
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `SHB-${new Date().getFullYear()}-${randomDigits}`;
    const paymentStatus: string = 'PENDING';
    const effectiveTxnId = transactionId || (sMethod === 'cod' ? `COD-${orderNumber}` : `TXN-${orderNumber}-${Date.now()}`);

    // Group items by vendorId for Multi-Vendor Split Orders
    const vendorItemsMap = new Map<string, VerifiedItem[]>();
    for (const vItem of verifiedItems) {
      if (!vendorItemsMap.has(vItem.vendorId)) {
        vendorItemsMap.set(vItem.vendorId, []);
      }
      vendorItemsMap.get(vItem.vendorId)!.push(vItem);
    }

    // -------------------------------------------------------------------------
    // 9. ATOMIC TRANSACTION: CREATE ORDER, SUB-ORDERS, LEDGER, DECREMENT STOCK
    // -------------------------------------------------------------------------
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Master Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal: serverSubtotal,
          shippingFee: serverShipping,
          discount: serverDiscount,
          total: serverTotal,
          paymentStatus,
          orderStatus: 'PROCESSING',
          paymentMethod: sMethod,
          transactionId: effectiveTxnId,
          shippingName: sName,
          shippingPhone: sPhone,
          shippingAddress: sAddress || 'ডিজিটাল ই-বুক ডেলিভারি (ঠিকানা প্রযোজ্য নয়)',
          shippingCity: sCity,
          isGiftWrapped: !!isGiftWrapped,
          giftMessage: isGiftWrapped ? giftMessage : null,
          giftWrapFee: serverGiftWrap,
          items: {
            create: verifiedItems.map((i) => ({
              bookId: i.bookId,
              type: i.type,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
          },
        },
      });

      // 2. Increment coupon usedCount if valid coupon was applied
      if (validCouponId) {
        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 3. Create Sub-Orders for Multi-Vendor fulfillment
      let vIndex = 1;
      for (const [vendorId, vItems] of Array.from(vendorItemsMap.entries())) {
        const vendorSubtotal = vItems.reduce((acc, it) => acc + it.totalPrice, 0);
        const vendorRecord = await tx.vendor.findUnique({ where: { id: vendorId } });
        const commissionRate = vendorRecord?.commissionRate || 10.0;
        const commissionAmt = (vendorSubtotal * commissionRate) / 100;
        const payoutAmt = vendorSubtotal - commissionAmt;

        const subOrderNum = `${orderNumber}-V${vIndex++}`;

        const subOrder = await tx.subOrder.create({
          data: {
            subOrderNumber: subOrderNum,
            orderId: newOrder.id,
            vendorId: vendorId,
            subtotal: vendorSubtotal,
            shippingFee: Math.round(serverShipping / vendorItemsMap.size),
            commissionRate,
            commissionAmt,
            payoutAmt,
            status: 'PROCESSING',
            courierName: 'Steadfast / Pathao Courier',
            items: {
              create: vItems.map((it) => ({
                bookId: it.bookId,
                title: it.title,
                coverImage: it.coverImage,
                price: it.unitPrice,
                quantity: it.quantity,
                total: it.totalPrice,
              })),
            },
          },
        });

        // 4. Create Seller Financial Ledger Entry
        await tx.sellerLedgerEntry.create({
          data: {
            vendorId,
            subOrderId: subOrder.id,
            type: 'ORDER_CREDIT',
            amount: payoutAmt,
            balanceAfter: payoutAmt,
            description: `সাব-অর্ডার #${subOrderNum} বিক্রয় বাবদ প্রদেয় ক্রেডিট (কমিশন: ৳ ${commissionAmt.toFixed(2)})`,
          },
        });
      }

      // 5. Decrement Stock & Create Inventory Logs / Digital Entitlements
      for (const vItem of verifiedItems) {
        if (vItem.type === 'PHYSICAL') {
          // If variant exists, decrement variant stock
          if (vItem.variantId) {
            await tx.productVariant.update({
              where: { id: vItem.variantId },
              data: {
                stockQuantity: {
                  decrement: vItem.quantity,
                },
              },
            });
          }

          // Decrement master book stock
          const updatedBook = await tx.book.update({
            where: { id: vItem.bookId },
            data: {
              stockQuantity: {
                decrement: vItem.quantity,
              },
            },
          });

          // Create inventory audit log
          await tx.inventoryLog.create({
            data: {
              bookId: vItem.bookId,
              changeType: 'ORDER_FULFILLMENT',
              quantityChange: -vItem.quantity,
              balanceAfter: updatedBook.stockQuantity,
              referenceId: orderNumber,
              reason: `অর্ডার #${orderNumber} বাবদ স্টক হ্রাস`,
            },
          });
        } else if (vItem.type === 'DIGITAL') {
          const existingEntitlement = await tx.digitalEntitlement.findFirst({
            where: {
              userId,
              bookId: vItem.bookId,
            },
          });

          if (!existingEntitlement) {
            await tx.digitalEntitlement.create({
              data: {
                userId,
                bookId: vItem.bookId,
                type: 'PURCHASE',
              },
            });
          }
        }
      }

      // 6. Create Payment Transaction Record
      await tx.paymentTransaction.create({
        data: {
          orderId: newOrder.id,
          gateway: sMethod.toUpperCase(),
          amount: serverTotal,
          currency: 'BDT',
          transactionId: effectiveTxnId,
          status: paymentStatus === 'PAID' ? 'SUCCESS' : 'INITIATED',
          gatewayResponse: JSON.stringify({
            method: sMethod,
            status: paymentStatus,
            effectiveTxnId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      // 7. Create User Notification
      await tx.notification.create({
        data: {
          userId,
          title: `অর্ডার নিশ্চিত হয়েছে (#${orderNumber})`,
          message: `আপনার ${orderNumber} নম্বরের অর্ডারটি সফলভাবে গৃহীত হয়েছে। মোট মূল্য: ৳ ${serverTotal}।`,
          type: 'ORDER',
          link: `/account/orders`,
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: order.total,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discount: order.discount,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'অর্ডার প্রক্রিয়াকরণে সার্ভার ত্রুটি হয়েছে।' },
      { status: 500 }
    );
  }
}

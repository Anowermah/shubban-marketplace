import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { initiateSSLCommerz } from '@/lib/payments/sslcommerz';
import { initiateBkash } from '@/lib/payments/bkash';
import { reserveStock } from '@/lib/inventory/service';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const body = await req.json();
    const { orderId, gateway = 'SSLCOMMERZ' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'অর্ডার আইডি আবশ্যক।' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি ডাটাবেজে পাওয়া যায়নি।' }, { status: 404 });
    }

    if (session && order.userId !== session.id && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'এই অর্ডারের পেমেন্ট করার অনুমতি নেই।' }, { status: 403 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'এই অর্ডারের পেমেন্ট ইতিপূর্বেই সফলভাবে পরিশোধ করা হয়েছে।',
        alreadyPaid: true,
        redirectUrl: `/order-confirmation?orderNumber=${order.orderNumber}`,
      });
    }

    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'অর্ডারটি পূর্বে বাতিল করা হয়েছে। নতুন করে অর্ডার করুন।' },
        { status: 400 }
      );
    }

    // Reserve stock if physical items exist
    try {
      await reserveStock(
        order.id,
        order.items.map((it) => ({
          bookId: it.bookId,
          quantity: it.quantity,
          type: it.type,
        })),
        20
      );
    } catch (stockErr: any) {
      return NextResponse.json(
        { error: stockErr.message || 'পর্যাপ্ত স্টক না থাকায় পেমেন্ট শুরু করা যায়নি।' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const appBaseUrl = `${proto}://${host}`;

    const normalizedGateway = gateway.toUpperCase();
    const transactionId = `TXN-${order.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create or update PaymentTransaction
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: normalizedGateway,
        amount: order.total,
        currency: 'BDT',
        transactionId,
        status: 'INITIATED',
        gatewayResponse: JSON.stringify({
          initiatedAt: new Date().toISOString(),
          requestedGateway: normalizedGateway,
        }),
      },
    });

    // 1. SSLCOMMERZ
    if (normalizedGateway === 'SSLCOMMERZ') {
      const sslRes = await initiateSSLCommerz({
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.total,
        customerName: order.shippingName || order.user.name,
        customerEmail: order.user.email,
        customerPhone: order.shippingPhone,
        customerAddress: order.shippingAddress,
        customerCity: order.shippingCity,
        appBaseUrl,
        transactionId,
      });

      if (!sslRes.success) {
        return NextResponse.json({ error: sslRes.error || 'SSLCommerz সেশন ব্যর্থ হয়েছে।' }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        gateway: 'SSLCOMMERZ',
        gatewayUrl: sslRes.gatewayUrl,
        transactionId,
      });
    }

    // 2. bKash
    if (normalizedGateway === 'BKASH') {
      const bkashRes = await initiateBkash({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.total,
        appBaseUrl,
        transactionId,
      });

      if (!bkashRes.success) {
        return NextResponse.json({ error: bkashRes.error || 'বিকাশ পেমেন্ট সেশন ব্যর্থ হয়েছে।' }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        gateway: 'BKASH',
        gatewayUrl: bkashRes.bkashURL,
        transactionId,
      });
    }

    // 3. Cash on Delivery (COD)
    if (normalizedGateway === 'COD') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: 'cod',
          paymentStatus: 'PENDING',
          orderStatus: 'PROCESSING',
        },
      });

      return NextResponse.json({
        success: true,
        gateway: 'COD',
        redirectUrl: `/order-confirmation?orderNumber=${order.orderNumber}`,
      });
    }

    return NextResponse.json({ error: 'অসমর্থিত পেমেন্ট মেথড।' }, { status: 400 });
  } catch (error: any) {
    console.error('Payment initiate error:', error);
    return NextResponse.json(
      { error: error.message || 'পেমেন্ট শুরু করতে সার্ভার সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}


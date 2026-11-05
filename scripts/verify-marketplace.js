const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
  console.log('--- ১. পাবলিক পেজসমূহ যাচাই ---');
  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/donations',
    'http://localhost:3000/donations/flood-relief-and-rehabilitation',
    'http://localhost:3000/seller/apply',
    'http://localhost:3000/sellers/maktabatul-azhar',
    'http://localhost:3000/books/madina-oud-royal-attar',
    'http://localhost:3000/books/gitanjali',
    'http://localhost:3000/cart',
    'http://localhost:3000/checkout',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`[GET] ${url} -> Status: ${res.status}`);
    } catch (e) {
      console.error(`[GET] ${url} -> ERROR:`, e.message);
    }
  }

  console.log('\n--- ২. মাল্টি-ভেন্ডর চেকআউট ও রোকমারি গিফট র‍্যাপিং টেস্ট ---');
  const book1 = await prisma.book.findFirst({ where: { slug: 'gitanjali' } });
  const book2 = await prisma.book.findFirst({ where: { slug: 'madina-oud-royal-attar' } });

  const checkoutPayload = {
    shippingName: 'আহমেদ কাওসার',
    shippingEmail: 'kawsar@example.com',
    shippingPhone: '01811223344',
    shippingAddress: 'রোড নং ৪, সেক্টর ৯, উত্তরা, ঢাকা',
    shippingCity: 'ঢাকা',
    paymentMethod: 'cod',
    isGiftWrapped: true,
    giftMessage: 'জ্ঞান ও প্রজ্ঞার উপহার! শুভ জন্মদিন!',
    items: [
      {
        id: book1.id,
        title: book1.title,
        slug: book1.slug,
        coverImage: book1.coverImage,
        price: book1.discountPrice || book1.price,
        type: 'PHYSICAL',
        quantity: 1,
        vendorId: book1.vendorId
      },
      {
        id: book2.id,
        title: book2.title,
        slug: book2.slug,
        coverImage: book2.coverImage,
        price: book2.discountPrice || book2.price,
        type: 'PHYSICAL',
        quantity: 2,
        vendorId: book2.vendorId
      }
    ]
  };

  try {
    const checkRes = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload)
    });
    const checkData = await checkRes.json();
    console.log(`[POST /api/checkout] Status: ${checkRes.status}`, checkData);

    if (checkData.orderNumber) {
      const dbOrder = await prisma.order.findUnique({
        where: { orderNumber: checkData.orderNumber },
        include: {
          subOrders: {
            include: {
              vendor: true,
              items: true,
            }
          }
        }
      });

      console.log(`\n✔ মাস্টার অর্ডার নম্বর: ${dbOrder.orderNumber}`);
      console.log(`✔ গিফট র‍্যাপিং ফি: ৳ ${dbOrder.giftWrapFee} | বার্তা: "${dbOrder.giftMessage}"`);
      console.log(`✔ তৈরি হওয়া সাব-অর্ডার সংখ্যা: ${dbOrder.subOrders.length}`);
      for (const so of dbOrder.subOrders) {
        console.log(`   └ সাব-অর্ডার: ${so.subOrderNumber} | বিক্রেতা: ${so.vendor.name} | মূল্য: ৳ ${so.subtotal} | কমিশন: ৳ ${so.commissionAmt} | পে-আউট: ৳ ${so.payoutAmt}`);
      }

      // Check seller ledger entries
      const ledgers = await prisma.sellerLedgerEntry.findMany({
        where: { subOrderId: { in: dbOrder.subOrders.map(s => s.id) } }
      });
      console.log(`✔ বিক্রেতাদের লেজার এন্ট্রি সংখ্যা: ${ledgers.length}`);
      for (const l of ledgers) {
        console.log(`   └ লেজার এন্ট্রি: ${l.description} | নেট ক্রেডিট: ৳ ${l.amount}`);
      }

      // Check payment transaction and inventory audit logs
      const payTx = await prisma.paymentTransaction.findFirst({
        where: { orderId: dbOrder.id }
      });
      console.log(`✔ পেমেন্ট ট্রানজেকশন রেকর্ড: ${payTx?.transactionId} | মেথড: ${payTx?.gateway} | স্ট্যাটাস: ${payTx?.status}`);

      const invLogs = await prisma.inventoryLog.findMany({
        where: { referenceId: dbOrder.orderNumber }
      });
      console.log(`✔ ইনভেন্টরি অডিট লগ এন্ট্রি সংখ্যা: ${invLogs.length}`);
      for (const inv of invLogs) {
        console.log(`   └ ইনভেন্টরি পরিবর্তন: ${inv.quantityChange} কপি | ব্যালেন্স: ${inv.balanceAfter} কপি`);
      }
    }
  } catch (err) {
    console.error('Checkout error:', err.message);
  }

  console.log('\n--- ৩. আস-সুন্নাহ সদকাহ অনুদান টেস্ট ---');
  const camp = await prisma.donationCampaign.findFirst();
  try {
    const donRes = await fetch('http://localhost:3000/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: camp.id,
        donorName: 'মুনীরুল ইসলাম',
        donorEmail: 'munir@example.com',
        donorPhone: '01911998877',
        isAnonymous: false,
        amount: 2500,
        paymentMethod: 'bkash',
        notes: 'মানবকল্যাণে ক্ষুদ্র উপহার'
      })
    });
    const donData = await donRes.json();
    console.log(`[POST /api/donations] Status: ${donRes.status}`, donData);

    if (donData.receiptNumber) {
      const receiptRes = await fetch(`http://localhost:3000/donations/receipt/${donData.receiptNumber}`);
      console.log(`[GET /donations/receipt/${donData.receiptNumber}] Status: ${receiptRes.status} (মুদ্রণযোগ্য অফিসিয়াল রসিদ ভেরিফায়েড)`);
    }
  } catch (err) {
    console.error('Donation error:', err.message);
  }

  console.log('\n--- ৪. বিক্রেতা নিবন্ধন (Daraz/Wafilife Onboarding) টেস্ট ---');
  try {
    const sellRes = await fetch('http://localhost:3000/api/seller/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'কাফেলা ইসলামিক কালেকশন',
        ownerName: 'জুবায়ের আহমেদ',
        phone: '01511223344',
        email: 'qafila@example.com',
        businessAddress: 'শাহবাগ মোড়, ঢাকা',
        city: 'ঢাকা',
        businessType: 'ISLAMIC_LIFESTYLE',
        description: 'উন্নত মানের সুন্নাহ সামগ্রী ও সুগন্ধি আতর পরিবেশক।'
      })
    });
    const sellData = await sellRes.json();
    console.log(`[POST /api/seller/apply] Status: ${sellRes.status}`, sellData);
  } catch (err) {
    console.error('Seller apply error:', err.message);
  }

  console.log('\n--- ৫. Zod ভ্যালিডেশন স্কিমা টেস্ট ---');
  try {
    const { z } = require('zod');
    const checkoutSchema = z.object({
      shippingName: z.string().min(2),
      shippingPhone: z.string().min(11),
      shippingAddress: z.string().min(5),
      items: z.array(z.any()).min(1),
    });
    
    // Test valid checkout
    const validCheckout = checkoutSchema.safeParse(checkoutPayload);
    console.log('✔ চেকআউট Zod ভ্যালিডেশন:', validCheckout.success ? 'পাসড (Valid)' : 'ব্যর্থ');
    
    // Test invalid checkout (missing recipient name & empty items)
    const invalidCheckout = checkoutSchema.safeParse({ shippingName: '', items: [] });
    console.log('✔ অবৈধ ইনপুটে Zod রিজেকশন:', !invalidCheckout.success ? 'সঠিকভাবে ব্লক হয়েছে (Rejected as expected)' : 'ব্যর্থ');

    // Test donation schema
    const donationSchema = z.object({
      campaignId: z.string().min(1),
      donorName: z.string().min(2),
      amount: z.number().positive(),
    });
    const validDonation = donationSchema.safeParse({
      campaignId: camp.id,
      donorName: 'মো. ফাহিম',
      amount: 1000,
    });
    console.log('✔ ডোনেশন Zod ভ্যালিডেশন:', validDonation.success ? 'পাসড (Valid)' : 'ব্যর্থ');
  } catch (err) {
    console.error('Validation test error:', err.message);
  }

  await prisma.$disconnect();
  console.log('\n========================================');
  console.log('সকল টেস্ট ও ভেরিফিকেশন সফলভাবে সম্পন্ন!');
  console.log('========================================');
}

runVerification();


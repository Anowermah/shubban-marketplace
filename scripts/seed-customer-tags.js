const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCustomerTags() {
  console.log('--- Checking & Seeding Default Customer Tags ---');

  const count = await prisma.customerTag.count();
  if (count > 0) {
    console.log(`Found ${count} existing customer tags. Skipping.`);
    return;
  }

  const tags = [
    { name: 'নতুন গ্রাহক (New Customer)', slug: 'new-customer', color: '#3B82F6', description: 'সম্প্রতি একাউন্ট খুলেছেন বা প্রথম অর্ডার দিয়েছেন।' },
    { name: 'নিয়মিত ক্রেতা (Regular Customer)', slug: 'regular-customer', color: '#10B981', description: 'নিয়মিত কেনাকাটা করা বিশ্বস্ত গ্রাহক।' },
    { name: 'ভিআইপি গ্রাহক (VIP Member)', slug: 'vip-member', color: '#D97706', description: 'সর্বোচ্চ ভলিউম ও প্রিমিয়াম গ্রাহক।' },
    { name: 'বড় অঙ্কের ক্রেতা (High Value)', slug: 'high-value', color: '#8B5CF6', description: 'গড় অর্ডারের চেয়ে অধিক মূল্যের কেনাকাটা করেন।' },
    { name: 'পুস্তকপ্রেমী পাঠক (Book Lover)', slug: 'book-lover', color: '#059669', description: 'ধারাবাহিকভাবে নিয়মিত বই ও প্রকাশনা ক্রয় করেন।' },
    { name: 'নিষ্ক্রিয় গ্রাহক (Inactive)', slug: 'inactive-customer', color: '#6B7280', description: 'দীর্ঘদিন কোনো সক্রিয়তা বা অর্ডার নেই।' },
  ];

  for (const tag of tags) {
    await prisma.customerTag.create({ data: tag });
    console.log(`Created Tag: ${tag.name}`);
  }

  // Also update existing customer records with default statuses and tags if null
  const customers = await prisma.user.findMany({
    where: {
      role: { in: ['CUSTOMER', 'REGISTERED_MEMBER', 'PAID_MEMBER', 'GUEST', 'READER', 'SUBSCRIBER'] },
    },
    take: 15,
  });

  const tagNames = ['নিয়মিত ক্রেতা (Regular Customer)', 'পুস্তকপ্রেমী পাঠক (Book Lover)', 'ভিআইপি গ্রাহক (VIP Member)', 'নতুন গ্রাহক (New Customer)'];
  const updatePromises = customers.map((cust, i) => {
    const assignedTags = [tagNames[i % tagNames.length]];
    return prisma.user.update({
      where: { id: cust.id },
      data: {
        status: i % 12 === 0 ? 'SUSPENDED' : i % 15 === 0 ? 'PENDING_VERIFICATION' : 'ACTIVE',
        customerTags: JSON.stringify(assignedTags),
        customerType: i % 8 === 0 ? 'BUSINESS' : i % 10 === 0 ? 'INSTITUTIONAL' : 'INDIVIDUAL',
        country: 'Bangladesh',
        city: i % 3 === 0 ? 'ঢাকা' : i % 3 === 1 ? 'চট্টগ্রাম' : 'সিলেট',
        lastLoginAt: new Date(Date.now() - (i * 3600 * 24 * 1000)),
      },
    });
  });

  await prisma.$transaction(updatePromises);
  console.log(`Updated sample customer metadata for ${customers.length} users.`);
}

seedCustomerTags()
  .catch((err) => {
    console.error('Error seeding customer tags:', err);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) { }
    process.exit(0);
  });

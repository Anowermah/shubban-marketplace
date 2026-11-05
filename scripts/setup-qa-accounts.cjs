const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupQA() {
  const hash = await bcrypt.hash('Password123!', 10);

  // 1. Dedicated QA Reader
  await prisma.user.upsert({
    where: { email: 'qa_reader@shubban.com' },
    update: { passwordHash: hash, status: 'ACTIVE', role: 'REGISTERED_MEMBER' },
    create: {
      name: 'কিউএ টেস্ট পাঠক',
      email: 'qa_reader@shubban.com',
      passwordHash: hash,
      role: 'REGISTERED_MEMBER',
      status: 'ACTIVE',
      membershipTier: 'FREE',
    },
  });

  // 2. Dedicated QA Publisher
  await prisma.user.upsert({
    where: { email: 'qa_publisher@shubban.com' },
    update: { passwordHash: hash, status: 'ACTIVE', role: 'PUBLISHER' },
    create: {
      name: 'কিউএ টেস্ট প্রকাশক',
      email: 'qa_publisher@shubban.com',
      passwordHash: hash,
      role: 'PUBLISHER',
      status: 'ACTIVE',
      membershipTier: 'INSTITUTIONAL',
    },
  });

  // 3. Dedicated QA Reset User
  await prisma.user.upsert({
    where: { email: 'qa_reset@shubban.com' },
    update: { passwordHash: hash, status: 'ACTIVE', role: 'REGISTERED_MEMBER' },
    create: {
      name: 'কিউএ টেস্ট রিসেট ব্যবহারকারী',
      email: 'qa_reset@shubban.com',
      passwordHash: hash,
      role: 'REGISTERED_MEMBER',
      status: 'ACTIVE',
      membershipTier: 'FREE',
    },
  });

  console.log('QA Accounts successfully provisioned.');
  await prisma.$disconnect();
}

setupQA().catch(console.error);


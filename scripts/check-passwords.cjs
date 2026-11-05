const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPasswords() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['admin@shubban.com', 'checker_admin@shubban.com', 'reader@shubban.com', 'subscriber@shubban.com', 'maktaba_salaf_seller@test.com', 'advertiser.qa@shubban.com'] }
    },
    select: { email: true, passwordHash: true, role: true, status: true }
  });

  for (const u of users) {
    const isPass123 = await bcrypt.compare('password123', u.passwordHash);
    const isAdmin123 = await bcrypt.compare('admin123', u.passwordHash);
    const isSub123 = await bcrypt.compare('sub123', u.passwordHash);
    const isSeller123 = await bcrypt.compare('seller123', u.passwordHash);
    const isReader123 = await bcrypt.compare('reader123', u.passwordHash);
    const isAdv123 = await bcrypt.compare('advertiser123', u.passwordHash);
    console.log(u.email, 'role:', u.role, 'status:', u.status, {
      password123: isPass123,
      admin123: isAdmin123,
      sub123: isSub123,
      seller123: isSeller123,
      reader123: isReader123,
      advertiser123: isAdv123
    });
  }
  await prisma.$disconnect();
}
checkPasswords().catch(console.error);


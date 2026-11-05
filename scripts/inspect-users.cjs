const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectEntities() {
  const advertisers = await prisma.advertiser.findMany({
    select: {
      id: true,
      companyName: true,
      ownerId: true,
      owner: { select: { email: true, name: true, role: true } },
      members: { select: { user: { select: { email: true } }, role: true } }
    }
  });
  console.log('Advertisers:\n', JSON.stringify(advertisers, null, 2));

  const publishers = await prisma.publisher.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      user: { select: { email: true, name: true, role: true } },
      members: { select: { user: { select: { email: true } }, role: true } }
    }
  });
  console.log('Publishers:\n', JSON.stringify(publishers, null, 2));

  const staff = await prisma.staffProfile.findMany({
    take: 5,
    select: {
      id: true,
      employeeId: true,
      user: { select: { email: true, name: true, role: true } },
      department: { select: { name: true } },
      designation: { select: { name: true } }
    }
  });
  console.log('Sample Staff:\n', JSON.stringify(staff, null, 2));

  await prisma.$disconnect();
}

inspectEntities().catch(console.error);

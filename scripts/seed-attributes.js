const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAttributes() {
  console.log('--- Checking & Seeding Initial E-commerce Attributes ---');

  const count = await prisma.productAttribute.count();
  if (count > 0) {
    console.log(`Found ${count} existing attributes. Skipping seed.`);
    return;
  }

  // 1. Create Groups
  const groupsData = [
    {
      name: 'পোশাক ও পরিধানের বৈশিষ্ট্য (Apparel & Wear)',
      slug: 'apparel-specifications',
      description: 'পোশাক, পাঞ্জাবি, হিজাব, আবায়া ও সাধারণ ফ্যাশন পণ্যের সাইজ, কালার ও ফেব্রিক বিবরণ।',
      displayOrder: 1,
    },
    {
      name: 'আতর ও সুগন্ধি বৈশিষ্ট্য (Perfumes & Attar)',
      slug: 'perfume-specifications',
      description: 'আতর, পারফিউম ও তেলজাত সুগন্ধির বোতলের সাইজ, সুবাস ও ঘ্রাণ গভীরতা।',
      displayOrder: 2,
    },
    {
      name: 'বই ও বাঁধাই বৈশিষ্ট্য (Book Editions & Binding)',
      slug: 'book-specifications',
      description: 'বইয়ের বিভিন্ন সংস্করণ, বাঁধাই রূপ, ফন্ট সাইজ ও পেপারের ধরন।',
      displayOrder: 3,
    },
    {
      name: 'ইলেকট্রনিক্স ও গ্যাজেট (Electronics & Tech)',
      slug: 'tech-specifications',
      description: 'ডিজিটাল গ্যাজেট, মেমরি, স্টোরেজ ও টেকনিক্যাল স্পেসিফিকেশন।',
      displayOrder: 4,
    },
  ];

  const createdGroups = {};
  for (const g of groupsData) {
    const group = await prisma.productAttributeGroup.create({
      data: g,
    });
    createdGroups[g.slug] = group.id;
    console.log(`Created Group: ${g.name}`);
  }

  // 2. Attributes with values
  const attributesData = [
    {
      name: 'রং (Color)',
      slug: 'color',
      code: 'COLOR',
      type: 'COLOR_SWATCH',
      displayLabel: 'পছন্দের রং নির্বাচন করুন',
      displayOrder: 1,
      isRequired: true,
      isVariant: true,
      showOnProduct: true,
      useInFilter: true,
      groupId: createdGroups['apparel-specifications'],
      values: [
        { name: 'কালো (Black)', slug: 'black', code: 'BLK', colorHex: '#18181B', displayOrder: 1 },
        { name: 'সাদা (White)', slug: 'white', code: 'WHT', colorHex: '#F4F4F5', displayOrder: 2 },
        { name: 'নেভি ব্লু (Navy Blue)', slug: 'navy-blue', code: 'NVY', colorHex: '#1E3A8A', displayOrder: 3 },
        { name: 'অলিভ গ্রিন (Olive Green)', slug: 'olive-green', code: 'OLV', colorHex: '#3F6212', displayOrder: 4 },
        { name: 'মেরুন (Maroon)', slug: 'maroon', code: 'MRN', colorHex: '#881337', displayOrder: 5 },
        { name: 'সোনালী অ্যাম্বার (Amber Gold)', slug: 'amber-gold', code: 'AMB', colorHex: '#D97706', displayOrder: 6 },
      ],
    },
    {
      name: 'সাইজ (Size)',
      slug: 'size',
      code: 'SIZE',
      type: 'BUTTON',
      displayLabel: 'সাইজ নির্বাচন করুন',
      displayOrder: 2,
      isRequired: true,
      isVariant: true,
      showOnProduct: true,
      useInFilter: true,
      groupId: createdGroups['apparel-specifications'],
      values: [
        { name: 'S (Small)', slug: 's', code: 'S', displayOrder: 1 },
        { name: 'M (Medium)', slug: 'm', code: 'M', displayOrder: 2 },
        { name: 'L (Large)', slug: 'l', code: 'L', displayOrder: 3 },
        { name: 'XL (Extra Large)', slug: 'xl', code: 'XL', displayOrder: 4 },
        { name: 'XXL (Double Extra Large)', slug: 'xxl', code: 'XXL', displayOrder: 5 },
      ],
    },
    {
      name: 'বোতলের মাপ (Attar Volume)',
      slug: 'attar-volume',
      code: 'VOLUME',
      type: 'SELECT',
      displayLabel: 'আতর বোতলের আয়তন নির্বাচন করুন',
      displayOrder: 3,
      isRequired: true,
      isVariant: true,
      showOnProduct: true,
      useInFilter: true,
      groupId: createdGroups['perfume-specifications'],
      values: [
        { name: '৩ মিলি রোল-অন বোতল (3ml)', slug: '3ml', code: '3ML', displayOrder: 1 },
        { name: '৬ মিলি ক্রিস্টাল বোতল (6ml)', slug: '6ml', code: '6ML', displayOrder: 2 },
        { name: '১২ মিলি প্রিমিয়াম ডিল্যাক্স (12ml)', slug: '12ml', code: '12ML', displayOrder: 3 },
        { name: '২৫ মিলি গিফট প্যাক (25ml)', slug: '25ml', code: '25ML', displayOrder: 4 },
      ],
    },
    {
      name: 'বাঁধাই ও সংস্করণ (Book Binding)',
      slug: 'binding-type',
      code: 'BINDING',
      type: 'RADIO',
      displayLabel: 'বই বাঁধাই ধরণ',
      displayOrder: 4,
      isRequired: true,
      isVariant: true,
      showOnProduct: true,
      useInFilter: true,
      groupId: createdGroups['book-specifications'],
      values: [
        { name: 'হার্ডকভার প্রিমিয়াম বাঁধাই', slug: 'hardcover', code: 'HC', displayOrder: 1 },
        { name: 'পেপারব্যাক সাধারণ বাঁধাই', slug: 'paperback', code: 'PB', displayOrder: 2 },
        { name: 'লেদার বাউন্ড এক্সক্লুসিভ', slug: 'leather-bound', code: 'LB', displayOrder: 3 },
      ],
    },
    {
      name: 'স্টোরেজ ধারণক্ষমতা (Storage)',
      slug: 'storage',
      code: 'STORAGE',
      type: 'BUTTON',
      displayLabel: 'ডিভাইস স্টোরেজ',
      displayOrder: 5,
      isRequired: false,
      isVariant: true,
      showOnProduct: true,
      useInFilter: true,
      groupId: createdGroups['tech-specifications'],
      values: [
        { name: '64 GB', slug: '64gb', code: '64G', displayOrder: 1 },
        { name: '128 GB', slug: '128gb', code: '128G', displayOrder: 2 },
        { name: '256 GB', slug: '256gb', code: '256G', displayOrder: 3 },
      ],
    },
    {
      name: 'কাপড়ের উপাদান (Fabric Type)',
      slug: 'fabric-type',
      code: 'FABRIC',
      type: 'SELECT',
      displayLabel: 'ফ্যাব্রিক উপাদান',
      displayOrder: 6,
      isRequired: false,
      isVariant: false, // Pure specification, not variant
      showOnProduct: true,
      useInFilter: true,
      groupId: createdGroups['apparel-specifications'],
      values: [
        { name: '১০০% পিওর কটন', slug: 'pure-cotton', code: 'COT', displayOrder: 1 },
        { name: 'জাকোয়ার্ড কটন ব্লেন্ড', slug: 'jacquard-cotton', code: 'JAC', displayOrder: 2 },
        { name: 'প্রিমিয়াম ভিসকোস সিল্ক', slug: 'viscose-silk', code: 'SLK', displayOrder: 3 },
      ],
    },
  ];

  for (const attr of attributesData) {
    const { values, ...attrFieldData } = attr;
    const createdAttr = await prisma.productAttribute.create({
      data: {
        ...attrFieldData,
        values: {
          create: values,
        },
      },
      include: { values: true },
    });
    console.log(`Created Attribute: ${createdAttr.name} with ${createdAttr.values.length} values.`);
  }

  // Also connect an attribute assignment to sample books that already have variants
  const booksWithVariants = await prisma.book.findMany({
    where: { variants: { some: {} } },
    take: 3,
  });

  const bindingAttr = await prisma.productAttribute.findUnique({
    where: { code: 'BINDING' },
    include: { values: true },
  });

  if (bindingAttr && booksWithVariants.length > 0) {
    for (const book of booksWithVariants) {
      const assignment = await prisma.productAttributeAssignment.create({
        data: {
          bookId: book.id,
          attributeId: bindingAttr.id,
          isRequired: true,
          isVariant: true,
          defaultValue: bindingAttr.values[0]?.name || null,
        },
      });

      for (const val of bindingAttr.values) {
        await prisma.productAttributeAssignmentValue.create({
          data: {
            assignmentId: assignment.id,
            valueId: val.id,
          },
        });
      }
      console.log(`Assigned '${bindingAttr.name}' to book: ${book.title}`);
    }
  }

  console.log('Seeding completed successfully!');
}

seedAttributes()
  .catch((err) => {
    console.error('Error seeding attributes:', err);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {}
    process.exit(0);
  });

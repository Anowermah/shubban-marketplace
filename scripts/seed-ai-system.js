const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAiSystem() {
  console.log('--- Seeding AI Autonomous Management System ---');

  // 1. Seed AI Provider Settings
  const providers = [
    {
      providerKey: 'local',
      name: 'Shubban Native NLP Orchestrator (বিল্ট-ইন লোকাল ইঞ্জিন)',
      isEnabled: true,
      modelName: 'shubban-rule-engine-v1',
      temperature: 0.3,
      maxTokens: 2048,
    },
    {
      providerKey: 'gemini',
      name: 'Google Gemini (Gemini 2.0 Flash / Pro)',
      isEnabled: true,
      modelName: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 2048,
    },
    {
      providerKey: 'openai',
      name: 'OpenAI (GPT-4o / GPT-4o-mini)',
      isEnabled: false,
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
    },
  ];

  for (const p of providers) {
    const existing = await prisma.aiProviderSetting.findUnique({
      where: { providerKey: p.providerKey },
    });
    if (!existing) {
      await prisma.aiProviderSetting.create({ data: p });
      console.log('✓ Created AI Provider Setting:', p.name);
    } else {
      console.log('• Existing AI Provider Setting:', p.name);
    }
  }

  // 2. Ensure Super Admin user has a starter conversation
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (adminUser) {
    const existingConvo = await prisma.aiConversation.findFirst({
      where: { userId: adminUser.id },
    });

    if (!existingConvo) {
      const convo = await prisma.aiConversation.create({
        data: {
          userId: adminUser.id,
          title: 'শুব্বান ওয়েবসাইট অটোনোমাস কমান্ড সেন্টার',
          messages: {
            create: [
              {
                sender: 'AI',
                content: 'আসসালামু আলাইকুম! আমি শুব্বান লাইব্রেরী অটোনোমাস ম্যানেজমেন্ট সিস্টেম। আপনি বাংলা বা ইংরেজিতে যে-কোনো নির্দেশনা দিতে পারেন — যেমন: "রমজান উপলক্ষে ক্যাম্পেইন তৈরি করো", "হোমপেজের ব্যানার সাজাও", "স্টক কম থাকা বইগুলোর তালিকা দাও" বা "নতুন কুপন কোড তৈরি করো"। আমি স্বয়ংক্রিয়ভাবে পরিকল্পনা তৈরি করে আপনার অনুমোদনের পর তা ওয়েবসাইটে বাস্তবায়ন করব।',
                tokensUsed: 65,
              },
            ],
          },
        },
      });
      console.log('✓ Created starter AI conversation for Super Admin:', convo.id);
    }
  }

  console.log('--- AI System Seed Complete ---');
}

seedAiSystem()
  .catch((e) => {
    console.error('Error seeding AI system:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


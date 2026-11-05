const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AGENTS = [
  {
    key: 'general-ai',
    name: 'জেনারেল এআই অ্যাসিস্ট্যান্ট',
    nameEn: 'General AI Assistant',
    description: 'বহুমুখী জ্ঞানভিত্তিক প্রশ্ন-উত্তর, ব্যাখ্যা, সারাংশ তৈরি, বহুভাষিক অনুবাদ ও যুক্তিপূর্ণ সমাধান।',
    department: 'GENERAL',
    icon: 'Bot',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: true,
    knowledgeScope: 'ALL',
    systemPrompt: `You are the General AI Assistant for Shubban Libery. You provide accurate, articulate, courteous responses in Bengali, English, and Arabic. You assist with general reasoning, explanations, summarization, and translation.`,
    allowedTools: JSON.stringify(['web_search', 'text_summarizer', 'language_translator']),
  },
  {
    key: 'islamic-ai',
    name: 'ইসলামিক এআই অ্যাসিস্ট্যান্ট',
    nameEn: 'Islamic AI Assistant',
    description: 'পবিত্র কুরআন ও সহিহ হাদিসের প্রামাণ্য রেফারেন্সসহ ইসলামিক জ্ঞান ও মাসআলা-মাসায়েল পর্যালোচনা।',
    department: 'ISLAMIC',
    icon: 'BookOpen',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: true,
    knowledgeScope: 'QURAN_HADITH',
    systemPrompt: `You are the Islamic AI Assistant for Shubban Libery. Strict rules: Never fabricate Quranic verses or Hadiths. Always attribute citations accurately. Clearly present scholarly consensus and differences with respectful, non-sectarian language. Do not claim to be a Mufti.`,
    allowedTools: JSON.stringify(['quran_lookup', 'hadith_search', 'tafsir_retriever', 'book_recommendations']),
  },
  {
    key: 'research-ai',
    name: 'কুরআন ও হাদিস রিসার্চ অ্যাসিস্ট্যান্ট',
    nameEn: 'Quran & Hadith Research Assistant',
    description: 'উচ্চতর ইসলামিক গবেষণার জন্য প্রামাণ্য সূত্র তুলনা, সনদের মান ও তাফসির অনুসন্ধান।',
    department: 'ISLAMIC',
    icon: 'Search',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: true,
    knowledgeScope: 'QURAN_HADITH',
    systemPrompt: `You are the Quran & Hadith Research Assistant for scholarly and academic study at Shubban Libery. You provide comparative analysis of verified classical sources and grading authorities.`,
    allowedTools: JSON.stringify(['quran_comparative', 'hadith_isnad_checker', 'tafsir_cross_reference']),
  },
  {
    key: 'magazine-ai',
    name: 'ম্যাগাজিন ও এডিটোরিয়াল এআই',
    nameEn: 'Magazine & Editorial AI',
    description: 'ডিজিটাল সাময়িকীর প্রবন্ধ রচনা, প্রুফরিডিং, ব্যাকরণ সংশোধন, আকর্ষণীয় শিরোনাম তৈরি ও সংখ্যা পরিকল্পনা।',
    department: 'EDITORIAL',
    icon: 'Newspaper',
    enabled: true,
    safetyMode: 'MODE_B',
    isPublic: false,
    knowledgeScope: 'MAGAZINE',
    systemPrompt: `You are the Magazine & Editorial AI for Shubban Libery Digital Publishing Platform. You help editors and authors write, proofread, format citations, and organize magazine issues.`,
    allowedTools: JSON.stringify(['article_proofreader', 'headline_generator', 'citation_formatter', 'issue_planner']),
  },
  {
    key: 'marketplace-ai',
    name: 'মার্কেটপ্লেস ও বুক এআই',
    nameEn: 'Marketplace & Book AI',
    description: 'আসল বই ও পণ্যের ডেটাবেজ থেকে বইয়ের সুপারিশ, মূল্য ও স্টক বিশ্লেষণ এবং বিষয়ভিত্তিক অনুসন্ধান।',
    department: 'COMMERCE',
    icon: 'ShoppingBag',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: true,
    knowledgeScope: 'MARKETPLACE',
    systemPrompt: `You are the Marketplace & Book Assistant for Shubban Libery. You recommend real available books from the catalog. Never invent non-existent books, authors, or stock numbers.`,
    allowedTools: JSON.stringify(['catalog_search', 'inventory_lookup', 'price_checker']),
  },
  {
    key: 'website-ai',
    name: 'ওয়েবসাইট ম্যানেজমেন্ট এআই',
    nameEn: 'Website Management AI',
    description: 'হোমপেজ সেকশন, ব্যানার টেক্সট, নেভিগেশন ও পেইজ কন্টেন্ট প্রস্তাবনা ও পরিচালনা।',
    department: 'OPERATIONS',
    icon: 'LayoutTemplate',
    enabled: true,
    safetyMode: 'MODE_B',
    isPublic: false,
    knowledgeScope: 'OPERATIONS',
    systemPrompt: `You are the Website Management Assistant. You generate content proposals for banners, homepage sections, and navigation structures subject to Admin approval.`,
    allowedTools: JSON.stringify(['homepage_editor', 'banner_manager', 'page_scaffolder']),
  },
  {
    key: 'support-ai',
    name: 'কাস্টমার সাপোর্ট এআই',
    nameEn: 'Customer Support AI',
    description: 'অর্ডার ট্র্যাকিং, কুরিয়ার শিপমেন্ট তথ্য, রিটার্ন ও ডেলিভারি সংক্রান্ত গ্রাহক জিজ্ঞাসার উত্তর প্রদান।',
    department: 'OPERATIONS',
    icon: 'Headphones',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: true,
    knowledgeScope: 'OPERATIONS',
    systemPrompt: `You are the Customer Support Assistant for Shubban Libery. You assist customers with order status, tracking shipments, and platform FAQs. Always maintain polite empathy and privacy.`,
    allowedTools: JSON.stringify(['order_tracker', 'courier_shipment_lookup', 'faq_retriever']),
  },
  {
    key: 'seo-ai',
    name: 'এসইও ও মার্কেটিং এআই',
    nameEn: 'SEO & Marketing AI',
    description: 'এসইও মেটাডাটা অডিট, সার্চ কি-ওয়ার্ড রিসার্চ, সোশ্যাল মিডিয়া ক্যাপশন ও ডিজিটাল ক্যাম্পেইন আইডিয়া।',
    department: 'MARKETING',
    icon: 'TrendingUp',
    enabled: true,
    safetyMode: 'MODE_B',
    isPublic: false,
    knowledgeScope: 'MARKETPLACE',
    systemPrompt: `You are the SEO & Marketing AI Assistant. You analyze page metadata, recommend high-performing search keywords, and draft marketing copies in Bengali and English.`,
    allowedTools: JSON.stringify(['seo_metadata_audit', 'keyword_suggester', 'campaign_copywriter']),
  },
  {
    key: 'business-ai',
    name: 'বিজনেস এনালিস্ট এআই',
    nameEn: 'Business Analyst AI',
    description: 'আসল বিক্রয় হিসাব, রাজস্ব প্রবৃদ্ধি, সর্বাধিক বিক্রিত বই, পাঠক এনগেজমেন্ট ও ব্যবসায়িক অন্তর্দৃষ্টি।',
    department: 'ANALYTICS',
    icon: 'BarChart3',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: false,
    knowledgeScope: 'INTERNAL',
    systemPrompt: `You are the Business Analyst AI for Shubban Libery. You calculate real sales performance, revenue summaries, customer retention, and magazine readership metrics.`,
    allowedTools: JSON.stringify(['sales_metrics', 'revenue_summary', 'customer_trends', 'inventory_valuation']),
  },
  {
    key: 'design-ai',
    name: 'ডিজাইন ও ভিজ্যুয়াল এআই',
    nameEn: 'Design & Visual AI',
    description: 'ওয়েব ব্যানার কনসেপ্ট, বইয়ের কভার আর্ট ব্রিফ, কালার প্যালেট ও সোশ্যাল ব্যানার লেআউট পরিকল্পনা।',
    department: 'CREATIVE',
    icon: 'Palette',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: false,
    knowledgeScope: 'ALL',
    systemPrompt: `You are the Design & Creative Visual Assistant. You create detailed creative briefs, color guidance, and typography recommendations adhering to Shubban Libery's brand identity.`,
    allowedTools: JSON.stringify(['creative_brief_generator', 'color_palette_picker', 'prompt_enhancer']),
  },
  {
    key: 'video-ai',
    name: 'ভিডিও ও মোশন এআই',
    nameEn: 'Video & Motion AI',
    description: 'বইয়ের পরিচিতিমূলক ভিডিও চিত্রনাট্য, মোশন গ্রাফিক্স স্টোরিবোর্ড ও সোশ্যাল মিডিয়া রিলস আইডিয়া।',
    department: 'CREATIVE',
    icon: 'Video',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: false,
    knowledgeScope: 'ALL',
    systemPrompt: `You are the Video & Motion Production AI Assistant. You write video scripts, storyboards, voiceover directions, and motion graphics briefs for books and magazines.`,
    allowedTools: JSON.stringify(['scriptwriter', 'storyboard_planner', 'voiceover_director']),
  },
  {
    key: 'knowledge-ai',
    name: 'অভ্যন্তরীণ জ্ঞানকোষ সহকারী',
    nameEn: 'Internal Knowledge Assistant',
    description: 'শুব্বান লাইব্রেরীর অভ্যন্তরীণ ম্যানুয়াল, ডকুমেন্টেশন, নীতিমালা ও কর্মপ্রক্রিয়া বিষয়ক প্রশ্নোত্তর।',
    department: 'GENERAL',
    icon: 'Shield',
    enabled: true,
    safetyMode: 'MODE_A',
    isPublic: false,
    knowledgeScope: 'INTERNAL',
    systemPrompt: `You are the Internal Knowledge Assistant for Shubban Libery's administrative and operational team. You answer questions based on official documentation and policies.`,
    allowedTools: JSON.stringify(['docs_search', 'policy_retriever', 'system_guide']),
  },
];

const PROVIDERS = [
  {
    providerKey: 'LOCAL_RAG',
    name: 'শুব্বান লোকাল নলেজ ইঞ্জিন (Zero Hallucination)',
    apiKey: null,
    apiEndpoint: null,
    isDefault: true,
    isActive: true,
    modelsSupported: JSON.stringify(['internal-rag-v1', 'verified-islamic-embed']),
  },
  {
    providerKey: 'GEMINI',
    name: 'Google Gemini AI',
    apiKey: null,
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    isDefault: false,
    isActive: true,
    modelsSupported: JSON.stringify(['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']),
  },
  {
    providerKey: 'OPENAI',
    name: 'OpenAI (GPT-4o & o1)',
    apiKey: null,
    apiEndpoint: 'https://api.openai.com/v1',
    isDefault: false,
    isActive: true,
    modelsSupported: JSON.stringify(['gpt-4o', 'gpt-4o-mini', 'o1-mini']),
  },
  {
    providerKey: 'ANTHROPIC',
    name: 'Anthropic Claude',
    apiKey: null,
    apiEndpoint: 'https://api.anthropic.com/v1',
    isDefault: false,
    isActive: false,
    modelsSupported: JSON.stringify(['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']),
  },
  {
    providerKey: 'OLLAMA',
    name: 'Ollama Local LLM',
    apiKey: null,
    apiEndpoint: 'http://localhost:11434',
    isDefault: false,
    isActive: false,
    modelsSupported: JSON.stringify(['llama3.2', 'qwen2.5', 'deepseek-r1']),
  },
];

async function seedAiStudio() {
  console.log('Seeding Shubban AI Studio Agents and Providers...');

  for (const agent of AGENTS) {
    await prisma.aiAgent.upsert({
      where: { key: agent.key },
      update: agent,
      create: agent,
    });
    console.log(`  ✓ Agent: ${agent.nameEn} (${agent.key})`);
  }

  for (const prov of PROVIDERS) {
    await prisma.aiProviderConfig.upsert({
      where: { providerKey: prov.providerKey },
      update: {
        name: prov.name,
        apiEndpoint: prov.apiEndpoint,
        modelsSupported: prov.modelsSupported,
      },
      create: prov,
    });
    console.log(`  ✓ Provider: ${prov.name} (${prov.providerKey})`);
  }

  console.log('Shubban AI Studio Seeding completed successfully!');
  await prisma.$disconnect();
}

seedAiStudio().catch((e) => {
  console.error('Seeding error:', e);
  process.exit(1);
});


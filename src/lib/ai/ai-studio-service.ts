import { prisma } from '@/lib/prisma';

export interface AiAgentDto {
  id: string;
  key: string;
  name: string;
  nameEn: string;
  description: string;
  department: string;
  icon: string;
  enabled: boolean;
  safetyMode: string;
  isPublic: boolean;
  systemPrompt: string;
  allowedTools: string[];
}

export class AiStudioService {
  /**
   * Retrieve all registered AI agents
   */
  static async getRegisteredAgents(): Promise<AiAgentDto[]> {
    try {
      const agents = await prisma.aiAgent.findMany({
        orderBy: { name: 'asc' },
      });

      return agents.map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        nameEn: a.nameEn,
        description: a.description,
        department: a.department,
        icon: a.icon,
        enabled: a.enabled,
        safetyMode: a.safetyMode,
        isPublic: a.isPublic,
        systemPrompt: a.systemPrompt,
        allowedTools: a.allowedTools ? JSON.parse(a.allowedTools) : [],
      }));
    } catch (error) {
      console.error('Error fetching registered agents:', error);
      return [];
    }
  }

  /**
   * Retrieve specific agent by its unique key
   */
  static async getAgentByKey(key: string) {
    return await prisma.aiAgent.findUnique({
      where: { key },
    });
  }

  /**
   * Enable or disable an agent
   */
  static async toggleAgent(key: string, enabled: boolean) {
    return await prisma.aiAgent.update({
      where: { key },
      data: { enabled },
    });
  }

  /**
   * Central AI Studio High-Level Statistics Aggregator
   */
  static async getStudioStats() {
    try {
      const [
        adminConvs,
        islamicConvs,
        adminMessages,
        islamicMessages,
        tasks,
        agentsCount,
        activeAgentsCount,
        providers,
        recentTasks,
        pendingApprovals,
      ] = await Promise.all([
        prisma.aiConversation.count(),
        prisma.islamicAiConversation.count(),
        prisma.aiMessage.count(),
        prisma.islamicAiMessage.count(),
        prisma.aiTask.count(),
        prisma.aiAgent.count(),
        prisma.aiAgent.count({ where: { enabled: true } }),
        prisma.aiProviderConfig.findMany({ orderBy: { isDefault: 'desc' } }),
        prisma.aiTask.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.aiApproval.count({ where: { decision: 'PENDING' } }),
      ]);

      const completedTasks = await prisma.aiTask.count({
        where: { status: 'COMPLETED' },
      });
      const failedTasks = await prisma.aiTask.count({
        where: { status: 'FAILED' },
      });

      return {
        totalConversations: adminConvs + islamicConvs,
        islamicConversations: islamicConvs,
        adminConversations: adminConvs,
        totalMessages: adminMessages + islamicMessages,
        totalTasks: tasks,
        completedTasks,
        failedTasks,
        pendingApprovals,
        totalAgents: agentsCount,
        activeAgents: activeAgentsCount,
        providers,
        recentTasks,
      };
    } catch (error) {
      console.error('Error fetching AI Studio stats:', error);
      return {
        totalConversations: 0,
        islamicConversations: 0,
        adminConversations: 0,
        totalMessages: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        pendingApprovals: 0,
        totalAgents: 12,
        activeAgents: 12,
        providers: [],
        recentTasks: [],
      };
    }
  }

  /**
   * Central Router Intent Classifier (Auto Mode)
   */
  static routeIntent(prompt: string): {
    agentKey: string;
    confidence: number;
    reason: string;
  } {
    const q = prompt.toLowerCase();

    // 1. Quran, Hadith, Islamic rulings, Fiqh
    if (
      q.includes('কুরআন') ||
      q.includes('হাদিস') ||
      q.includes('সূরা') ||
      q.includes('আয়াত') ||
      q.includes('নামাজ') ||
      q.includes('রোজা') ||
      q.includes('যাকাত') ||
      q.includes('হজ্ব') ||
      q.includes('হালাল') ||
      q.includes('হারাম') ||
      q.includes('ফতোয়া') ||
      q.includes('মাযহাব') ||
      q.includes('quran') ||
      q.includes('hadith') ||
      q.includes('islam') ||
      q.includes('tafsir')
    ) {
      if (q.includes('সনদ') || q.includes('রাবী') || q.includes('তাহকীক') || q.includes('গবেষণা') || q.includes('তুলনা')) {
        return {
          agentKey: 'research-ai',
          confidence: 0.95,
          reason: 'উচ্চতর হাদিস তাহকীক ও গবেষণামূলক প্রশ্ন শনাক্ত হয়েছে।',
        };
      }
      return {
        agentKey: 'islamic-ai',
        confidence: 0.96,
        reason: 'ইসলামিক ও দ্বীনি বিষয় সংক্রান্ত প্রশ্ন শনাক্ত হয়েছে।',
      };
    }

    // 2. Magazine & Editorial
    if (
      q.includes('ম্যাগাজিন') ||
      q.includes('সাময়িকী') ||
      q.includes('প্রবন্ধ') ||
      q.includes('নিবন্ধ') ||
      q.includes('সম্পাদকীয়') ||
      q.includes('সংখ্যা') ||
      q.includes('বানান') ||
      q.includes('প্রুফরিড') ||
      q.includes('magazine') ||
      q.includes('article') ||
      q.includes('editorial')
    ) {
      return {
        agentKey: 'magazine-ai',
        confidence: 0.92,
        reason: 'সাময়িকী, প্রবন্ধ লিখন বা সম্পাদকীয় সংশোধন সংক্রান্ত বিষয় শনাক্ত হয়েছে।',
      };
    }

    // 3. Marketplace & Books
    if (
      q.includes('বই') ||
      q.includes('লেখক') ||
      q.includes('দাম') ||
      q.includes('স্টক') ||
      q.includes('ক্যাটালগ') ||
      q.includes('পণ্য') ||
      q.includes('book') ||
      q.includes('author') ||
      q.includes('price') ||
      q.includes('discount')
    ) {
      return {
        agentKey: 'marketplace-ai',
        confidence: 0.9,
        reason: 'মার্কেটপ্লেস ও বইয়ের তথ্য সম্পর্কিত প্রশ্ন শনাক্ত হয়েছে।',
      };
    }

    // 4. Customer Support, Order & Shipment Tracking
    if (
      q.includes('অর্ডার') ||
      q.includes('ট্র্যাকিং') ||
      q.includes('শিপমেন্ট') ||
      q.includes('কুরিয়ার') ||
      q.includes('ডেলিভারি') ||
      q.includes('রিটার্ন') ||
      q.includes('রিফান্ড') ||
      q.includes('order') ||
      q.includes('track') ||
      q.includes('delivery') ||
      q.includes('courier')
    ) {
      return {
        agentKey: 'support-ai',
        confidence: 0.94,
        reason: 'অর্ডার ট্র্যাকিং ও গ্রাহক সহায়তা সম্পর্কিত প্রশ্ন শনাক্ত হয়েছে।',
      };
    }

    // 5. Website & Admin Operations
    if (
      q.includes('ব্যানার') ||
      q.includes('হোমপেজ') ||
      q.includes('সেকশন') ||
      q.includes('মেনু') ||
      q.includes('পেইজ') ||
      q.includes('layout') ||
      q.includes('homepage') ||
      q.includes('banner')
    ) {
      return {
        agentKey: 'website-ai',
        confidence: 0.88,
        reason: 'ওয়েবসাইট ব্যবস্থাপনা ও কনটেন্ট লেআউট সম্পর্কিত প্রশ্ন শনাক্ত হয়েছে।',
      };
    }

    // 6. SEO & Marketing
    if (
      q.includes('এসইও') ||
      q.includes('মেটা') ||
      q.includes('কি-ওয়ার্ড') ||
      q.includes('প্রচারণা') ||
      q.includes('ক্যাপশন') ||
      q.includes('seo') ||
      q.includes('keyword') ||
      q.includes('marketing')
    ) {
      return {
        agentKey: 'seo-ai',
        confidence: 0.9,
        reason: 'সার্চ ইঞ্জিন অপ্টিমাইজেশন ও মার্কেটিং সংক্রান্ত বিষয় শনাক্ত হয়েছে।',
      };
    }

    // 7. Business Analytics & Financials
    if (
      q.includes('বিক্রয়') ||
      q.includes('রাজস্ব') ||
      q.includes('লাভ') ||
      q.includes('হিসাব') ||
      q.includes('রিপোর্ট') ||
      q.includes('sales') ||
      q.includes('revenue') ||
      q.includes('analytics')
    ) {
      return {
        agentKey: 'business-ai',
        confidence: 0.91,
        reason: 'ব্যবসায়িক ও রাজস্ব বিশ্লেষণ সম্পর্কিত প্রশ্ন শনাক্ত হয়েছে।',
      };
    }

    // 8. Design & Visual
    if (
      q.includes('ডিজাইন') ||
      q.includes('কভার') ||
      q.includes('রঙ') ||
      q.includes('থাম্বনেইল') ||
      q.includes('design') ||
      q.includes('thumbnail') ||
      q.includes('visual')
    ) {
      return {
        agentKey: 'design-ai',
        confidence: 0.85,
        reason: 'ভিজ্যুয়াল আর্ট ও ডিজাইন ব্রিফ সম্পর্কিত বিষয় শনাক্ত হয়েছে।',
      };
    }

    // 9. Video & Motion
    if (
      q.includes('ভিডিও') ||
      q.includes('স্ক্রিপ্ট') ||
      q.includes('রিলস') ||
      q.includes('স্টোরিবোর্ড') ||
      q.includes('video') ||
      q.includes('script') ||
      q.includes('motion')
    ) {
      return {
        agentKey: 'video-ai',
        confidence: 0.89,
        reason: 'ভিডিও চিত্রনাট্য ও মোশন কনসেপ্ট সম্পর্কিত বিষয় শনাক্ত হয়েছে।',
      };
    }

    // Default: General AI
    return {
      agentKey: 'general-ai',
      confidence: 0.8,
      reason: 'সাধারণ ও বহুমুখী বুদ্ধিবৃত্তিক আলোচনার জন্য জেনারেল এআই নির্ধারিত।',
    };
  }
}


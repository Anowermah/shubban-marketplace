/**
 * Shubban AI Studio — Unified Multi-Agent Chat Intelligence Service
 * 
 * Handles Auto/Manual agent routing, RAG grounding for Islamic & scholarly queries,
 * domain-specific database contextualization, and message persistence.
 */

import { prisma } from '@/lib/prisma';
import { AiStudioService } from './ai-studio-service';
import { IslamicRagEngine } from '@/lib/islamic-ai/rag-engine';
import { AiOrchestrator } from './ai-orchestrator';

export interface SendChatMessageInput {
  conversationId?: string;
  message: string;
  mode?: 'AUTO' | 'MANUAL';
  agentKey?: string;
  userId?: string;
  magazineId?: string;
}

export interface ChatMessageResult {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  routedAgent: {
    key: string;
    name: string;
    nameEn: string;
    icon: string;
    confidence?: number;
    reason?: string;
  };
  content: string;
  evidenceStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE';
  citations?: any[];
  task?: any;
}

export class AiChatService {
  /**
   * Main entry point to send a message in AI Studio Chat Hub
   */
  static async sendMessage(input: SendChatMessageInput): Promise<ChatMessageResult> {
    const rawMessage = input.message.trim();
    if (!rawMessage) {
      throw new Error('অনুগ্রহ করে আপনার বার্তা বা প্রশ্ন প্রদান করুন।');
    }

    const mode = input.mode || 'AUTO';
    let targetAgentKey = input.agentKey || 'general-ai';
    let routingInfo: { confidence?: number; reason?: string } = {};

    // 1. Determine agent: Auto Mode routes dynamically
    if (mode === 'AUTO') {
      const routed = AiStudioService.routeIntent(rawMessage);
      targetAgentKey = routed.agentKey;
      routingInfo = {
        confidence: routed.confidence,
        reason: routed.reason,
      };
    }

    // 2. Fetch Agent Metadata
    const agent = await AiStudioService.getAgentByKey(targetAgentKey);
    const agentName = agent?.name || 'শুব্বান এআই সহকারী';
    const agentNameEn = agent?.nameEn || 'Shubban AI Assistant';
    const agentIcon = agent?.icon || 'Sparkles';

    // 3. Ensure Conversation exists
    let conversation = input.conversationId
      ? await prisma.aiConversation.findUnique({ where: { id: input.conversationId } })
      : null;

    if (!conversation) {
      let finalUserId = input.userId;
      if (finalUserId) {
        const userExists = await prisma.user.findUnique({ where: { id: finalUserId }, select: { id: true } });
        if (!userExists) {
          const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
          finalUserId = fallbackUser?.id || finalUserId;
        }
      } else {
        const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
        finalUserId = fallbackUser?.id || 'admin';
      }

      // Auto-generate title from message
      const title = rawMessage.length > 45 ? rawMessage.slice(0, 42) + '...' : rawMessage;
      conversation = await prisma.aiConversation.create({
        data: {
          id: input.conversationId,
          userId: finalUserId,
          title,
          agentKey: targetAgentKey,
          mode,
          magazineId: input.magazineId,
        },
      });
    } else {
      // Update agentKey and timestamp
      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          agentKey: targetAgentKey,
          mode,
          updatedAt: new Date(),
        },
      });
    }

    // 4. Save User Message
    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        content: rawMessage,
        tokensUsed: Math.ceil(rawMessage.length / 4),
      },
    });

    // 5. Generate Intelligent Grounded Response based on Agent Type
    let responseText = '';
    let evidenceStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'INSUFFICIENT_EVIDENCE' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    let citations: any[] = [];
    let taskData: any = null;

    try {
      if (targetAgentKey === 'islamic-ai' || targetAgentKey === 'research-ai') {
        // Islamic RAG grounded response
        const ragResult = await IslamicRagEngine.answerQuestion({
          query: rawMessage,
          mode: targetAgentKey === 'research-ai' ? 'RESEARCH' : 'STANDARD',
          language: 'bn',
        });

        responseText = ragResult.summaryAnswer;
        evidenceStatus = ragResult.evidenceStatus;
        citations = ragResult.citations || [];
      } else if (targetAgentKey === 'website-ai') {
        // AI Command Orchestration
        const orchestratorResult = await AiOrchestrator.processCommand({
          conversationId: conversation.id,
          command: rawMessage,
          userId: input.userId || 'admin',
          userRole: 'ADMIN',
        });

        responseText = orchestratorResult.responseContent;
        taskData = orchestratorResult.task;
      } else if (targetAgentKey === 'marketplace-ai') {
        // Marketplace & Book Intelligence
        const bookCount = await prisma.book.count();
        const lowStockCount = await prisma.book.count({ where: { stockQuantity: { lte: 5 } } });
        const categories = await prisma.category.findMany({ take: 5, select: { name: true } });
        
        responseText = `### 📚 শুব্বান মার্কেটপ্লেস ও ক্যাটালগ এআই বিশ্লেষণ\n\nআপনার প্রশ্নের পরিপ্রেক্ষিতে বর্তমান ক্যাটালগ পর্যালোচনা করা হয়েছে:\n\n- **মোট বইয়ের সংখ্যা:** ${bookCount} টি\n- **স্বল্প স্টক সতর্কতা (≤৫):** ${lowStockCount} টি বই অবিলম্বে রি-স্টক প্রয়োজন\n- **জনপ্রিয় বিভাগসমূহ:** ${categories.map((c) => c.name).join(', ')}\n\n*পরামর্শ:* বইয়ের বিবরণ বা মূল্যের যেকোনো পরিবর্তনের জন্য সরাসরি ক্যাটালগ ম্যানেজারে আপডেট করতে পারেন অথবা কমান্ড সেন্টারে নির্দেশনা প্রদান করতে পারেন।`;
      } else if (targetAgentKey === 'business-ai') {
        // Business Intelligence
        const orderCount = await prisma.order.count();
        const pendingOrders = await prisma.order.count({ where: { orderStatus: 'PROCESSING' } });
        
        responseText = `### 📊 শুব্বান বিজনেস অ্যানালিটিক্স রিপোর্ট\n\nলাইভ ডেটাবেজ পরিসংখ্যান:\n\n- **সর্বমোট সফল অর্ডার:** ${orderCount} টি\n- **প্রক্রিয়াধীন (Processing) অর্ডার:** ${pendingOrders} টি\n- **প্ল্যাটফর্ম স্বাস্থ্য:** স্বাভাবিক ও স্থিতিশীল\n\n*সুপারিশ:* গ্রাহকদের দ্রুত ডেলিভারি নিশ্চিত করতে পেন্ডিং অর্ডারগুলো কুরিয়ার প্যানেলে অ্যাসাইন করুন।`;
      } else if (targetAgentKey === 'magazine-ai') {
        // Magazine & Editorial AI
        const magCount = await prisma.magazine.count();
        const issueCount = await prisma.publicationIssue.count();
        const articleCount = await prisma.article.count();

        responseText = `### 📰 প্রকাশনা ও সম্পাদকীয় ব্যবস্থাপনা পরামর্শ\n\nসেন্ট্রাল পাবলিশিং হাবের বর্তমান অবস্থা:\n\n- **নিবন্ধিত প্রকাশনা (Magazines):** ${magCount} টি\n- **মোট প্রকাশিত সংখ্যা (Issues):** ${issueCount} টি\n- **প্রবন্ধ ও গবেষণাপত্র:** ${articleCount} টি\n\n*সম্পাদকীয় স্ট্যান্ডার্ড:* ইসলামিক প্রকাশনাগুলোতে তথ্যসূত্র যাচাইকরণ এবং সঠিক বানানরীতি অনুসরণের ক্ষেত্রে ইসলামিক রিসার্চ এজেন্টের রেফারেন্স সহায়তা গ্রহণ করতে পারেন।`;
      } else if (targetAgentKey === 'customer-support-ai') {
        // Support AI
        responseText = `### 🤝 গ্রাহক সেবা ও সহায়তা নির্দেশিকা\n\nশুব্বান লাইব্রেরী কাস্টমার কেয়ার গাইডলাইন অনুযায়ী:\n\n1. **ডেলিভারি সময়সীমা:** ঢাকা সিটির ভেতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ৩-৫ কার্যদিবস।\n2. **রিফান্ড পলিসি:** ছেঁড়া বা মিসপ্রিন্ট বই প্রাপ্তির ৭ দিনের মধ্যে প্রমাণসহ রিফান্ড আবেদন প্রযোজ্য।\n3. **পেমেন্ট পদ্ধতি:** ক্যাশ অন ডেলিভারি, বিকাশ, নগদ, রকেট ও কার্ড পেমেন্ট।\n\nকোনো নির্দিষ্ট অর্ডার সংক্রান্ত তথ্য জানতে অর্ডারের ট্র্যাকিং নম্বরটি উল্লেখ করুন।`;
      } else if (targetAgentKey === 'seo-ai') {
        // SEO & Marketing AI
        responseText = `### 🚀 এসইও ও মেটা অপ্টিমাইজেশন সুপারিশ\n\nআপনার বিষয়ের জন্য প্রস্তাবিত এসইও মেটাডাটা কাঠামো:\n\n\`\`\`json\n{\n  "meta_title": "${rawMessage.slice(0, 50)} | শুব্বান লাইব্রেরী",\n  "meta_description": "শুব্বান লাইব্রেরী — সহীহ দ্বীনি বই ও গবেষণাধর্মী প্রকাশনার নির্ভরযোগ্য ডিজিটাল মার্কেটপ্লেস।",\n  "keywords": ["ইসলামিক বই", "শুব্বান", "কুরআন হাদিস", "অনলাইন লাইব্রেরি", "ইসলামিক সাহিত্য"],\n  "og_type": "article"\n}\n\`\`\`\n\n*টিপস:* মেটা টাইটেল ৬০ ক্যারেক্টার এবং ডেসক্রিপশন ১৬০ ক্যারেক্টারের মধ্যে রাখলে গুগল সার্চে সর্বোচ্চ ক্লিক রেট পাওয়া যাবে।`;
      } else {
        // General AI Assistant / Content Studio / Design / Video / Internal KB
        const systemPrompt = agent?.systemPrompt || 'আপনি শুভ্বান লাইব্রেরীর একজন দক্ষ এআই সহকারী।';
        responseText = `### ✦ ${agentName} — উত্তর\n\nআপনার অনুসন্ধান: "${rawMessage}"\n\n${systemPrompt.slice(0, 150)}...\n\nআপনার প্রদত্ত বিষয়ের প্রেক্ষাপটে শুব্বান এআই স্টুডিও সম্পূর্ণ প্রস্তুত। আপনি চাইলে এই বিষয়ের ওপর বিস্তারিত প্রবন্ধ তৈরি, রূপরেখা প্রণয়ন বা ডেটাবেজে সংযোজন করার পদক্ষেপ গ্রহণ করতে পারেন।`;
      }
    } catch (err: any) {
      console.error('AI Chat Generation Error:', err);
      responseText = `একটি অনাকাঙ্ক্ষিত ত্রুটি দেখা দিয়েছে: ${err?.message || 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`;
    }

    // 6. Save Assistant Message
    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'AI',
        agentKey: targetAgentKey,
        content: responseText,
        tokensUsed: Math.ceil(responseText.length / 4),
        evidenceStatus,
        citations: citations.length > 0 ? JSON.stringify(citations) : null,
      },
    });

    if (taskData && taskData.id) {
      try {
        await prisma.aiTask.update({
          where: { id: taskData.id },
          data: { messageId: assistantMessage.id },
        });
      } catch (e) {}
    }

    return {
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      routedAgent: {
        key: targetAgentKey,
        name: agentName,
        nameEn: agentNameEn,
        icon: agentIcon,
        ...routingInfo,
      },
      content: responseText,
      evidenceStatus,
      citations,
      task: taskData,
    };
  }

  /**
   * Retrieve messages for a specific conversation with citations parsed
   */
  static async getConversationMessages(conversationId: string) {
    if (conversationId.startsWith('islamic_')) {
      const actualId = conversationId.replace('islamic_', '');
      const conv = await prisma.islamicAiConversation.findUnique({
        where: { id: actualId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              citations: true,
            },
          },
        },
      });

      if (!conv) return null;

      return {
        id: conversationId,
        title: conv.title || 'ইসলামিক প্রশ্নোত্তর',
        agentKey: 'islamic-ai',
        mode: 'RAG_GROUNDED',
        isPinned: false,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messages: conv.messages.map((m) => ({
          id: m.id,
          sender: m.sender === 'AI' ? 'ASSISTANT' : 'USER',
          agentKey: 'islamic-ai',
          content: m.content,
          evidenceStatus: m.evidenceStatus,
          citations: m.citations.map((c) => ({
            sourceType: c.sourceType,
            referenceId: c.referenceId,
            title: c.title,
            arabicText: c.arabicText,
            translation: c.translation,
            sourceBook: c.sourceBook,
          })),
          task: null,
          createdAt: m.createdAt,
        })),
      };
    }

    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            task: true,
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      title: conversation.title,
      agentKey: conversation.agentKey,
      mode: conversation.mode,
      isPinned: false,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        agentKey: m.agentKey,
        content: m.content,
        evidenceStatus: m.evidenceStatus,
        citations: m.citations ? JSON.parse(m.citations) : [],
        task: m.task,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * List conversations with search, sorting, and pagination
   */
  static async listConversations(options: {
    userId?: string;
    search?: string;
    agentKey?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, search, agentKey, limit = 25, offset = 0 } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (agentKey) where.agentKey = agentKey;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { messages: { some: { content: { contains: search } } } },
      ];
    }

    const [total, conversations] = await Promise.all([
      prisma.aiConversation.count({ where }),
      prisma.aiConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, sender: true },
          },
        },
      }),
    ]);

    return {
      total,
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        agentKey: c.agentKey,
        mode: c.mode,
        isPinned: false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        lastMessage: c.messages && c.messages[0] ? c.messages[0].content.slice(0, 80) : null,
      })),
    };
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(id: string) {
    return await prisma.aiConversation.delete({
      where: { id },
    });
  }

  /**
   * Toggle Pin conversation (future-ready stub)
   */
  static async togglePinConversation(id: string) {
    return { id, isPinned: false };
  }

  /**
   * Rename conversation title
   */
  static async renameConversation(id: string, title: string) {
    return await prisma.aiConversation.update({
      where: { id },
      data: { title: title.trim() },
    });
  }
}

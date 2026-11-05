/**
 * Shubban AI Autonomous Management System — Central AI Orchestrator
 * 
 * Natural language intent detection (Bengali & English), contextual task planning,
 * safety mode evaluation, execution routing, approval dispatching, and rollback.
 */

import { prisma } from '@/lib/prisma';
import { evaluateSafetyAndMode, sanitizeUserCommand, SafetyMode } from './safety-engine';
import { AI_TOOLS } from './tools-registry';

export interface ProcessCommandInput {
  conversationId: string;
  command: string;
  userId: string;
  userRole: string;
}

export interface ProcessCommandOutput {
  conversationId: string;
  messageId: string;
  responseContent: string;
  task?: {
    id: string;
    intent: string;
    status: string;
    safetyMode: SafetyMode;
    planSummary: string;
    diffPreview?: any;
    data?: any;
  } | null;
}

export class AiOrchestrator {
  /**
   * Main entrypoint to process an Admin command
   */
  static async processCommand(input: ProcessCommandInput): Promise<ProcessCommandOutput> {
    const cleanCommand = sanitizeUserCommand(input.command);
    if (!cleanCommand) {
      throw new Error('কমান্ড টেক্সট প্রদান করা হয়নি।');
    }

    // 1. Verify / fetch conversation
    let conversation = await prisma.aiConversation.findUnique({
      where: { id: input.conversationId },
    });
    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          id: input.conversationId,
          userId: input.userId,
          title: cleanCommand.slice(0, 40) + '...',
        },
      });
    }

    // 2. Record User Message
    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        content: cleanCommand,
        tokensUsed: Math.ceil(cleanCommand.length / 4),
      },
    });

    // 3. Detect Intent & Formulate Execution Plan
    const detectedPlan = await this.detectIntentAndPlan(cleanCommand, input);

    // 4. Safety Mode Evaluation
    const safetyResult = evaluateSafetyAndMode(detectedPlan.intent, detectedPlan.parameters, cleanCommand);

    if (!safetyResult.allowed) {
      const blockedMsg = await prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'AI',
          content: `⚠️ নিরাপত্তা সতর্কতা: ${safetyResult.reason}`,
          tokensUsed: 30,
        },
      });

      return {
        conversationId: conversation.id,
        messageId: blockedMsg.id,
        responseContent: `⚠️ নিরাপত্তা সতর্কতা: ${safetyResult.reason}`,
        task: null,
      };
    }

    // 5. Handle based on Safety Mode
    if (safetyResult.mode === 'MODE_A') {
      // MODE A: AUTO EXECUTE IMMEDIATELY
      return await this.handleModeAExecution(conversation.id, userMessage.id, cleanCommand, detectedPlan, input.userId);
    } else {
      // MODE B & C: CREATE TASK PENDING APPROVAL WITH DIFF PREVIEW
      return await this.handleApprovalRequired(
        conversation.id,
        userMessage.id,
        cleanCommand,
        detectedPlan,
        safetyResult.mode,
        input.userId
      );
    }
  }

  /**
   * Execute Mode A low-risk tasks immediately
   */
  private static async handleModeAExecution(
    conversationId: string,
    messageId: string,
    command: string,
    plan: any,
    userId: string
  ): Promise<ProcessCommandOutput> {
    const tool = AI_TOOLS[plan.toolName];
    let toolResult: any = { success: false, message: 'টুল পাওয়া যায়নি।' };

    if (tool) {
      const startTime = Date.now();
      try {
        toolResult = await tool.execute(plan.parameters);
      } catch (err: any) {
        toolResult = { success: false, message: `ত্রুটি: ${err.message}` };
      }
      const durationMs = Date.now() - startTime;

      // Create AiTask record marked COMPLETED
      const task = await prisma.aiTask.create({
        data: {
          conversationId,
          messageId,
          command,
          intent: plan.intent,
          status: toolResult.success ? 'COMPLETED' : 'FAILED',
          safetyMode: 'MODE_A',
          planSummary: plan.summary,
          executedAt: new Date(),
          toolExecutions: {
            create: [
              {
                toolName: plan.toolName,
                inputParams: JSON.stringify(plan.parameters),
                outputData: JSON.stringify(toolResult.data || {}),
                isSuccess: toolResult.success,
                durationMs,
              },
            ],
          },
        },
      });

      // Record AI response
      const aiReply = await prisma.aiMessage.create({
        data: {
          conversationId,
          sender: 'AI',
          content: `${plan.summary}\n\n✓ ${toolResult.message}`,
          tokensUsed: 80,
        },
      });

      // Log usage
      await prisma.aiUsageLog.create({
        data: {
          userId,
          provider: 'INTERNAL_ORCHESTRATOR',
          model: 'shubban-rule-engine-v1',
          promptTokens: Math.ceil(command.length / 4),
          compTokens: 80,
          totalCostUsd: 0.0,
          actionType: plan.intent,
        },
      });

      return {
        conversationId,
        messageId: aiReply.id,
        responseContent: `${plan.summary}\n\n✓ ${toolResult.message}`,
        task: {
          id: task.id,
          intent: task.intent,
          status: task.status,
          safetyMode: 'MODE_A',
          planSummary: task.planSummary,
          data: toolResult.data,
        },
      };
    }

    // Default chat fallback if no tool
    const aiReply = await prisma.aiMessage.create({
      data: {
        conversationId,
        sender: 'AI',
        content: plan.summary,
        tokensUsed: 40,
      },
    });

    return {
      conversationId,
      messageId: aiReply.id,
      responseContent: plan.summary,
      task: null,
    };
  }

  /**
   * Handle Mode B & C tasks requiring Preview & Admin Approval
   */
  private static async handleApprovalRequired(
    conversationId: string,
    messageId: string,
    command: string,
    plan: any,
    mode: SafetyMode,
    userId: string
  ): Promise<ProcessCommandOutput> {
    // Create Task in PENDING_APPROVAL status with Before/After Diff
    const task = await prisma.aiTask.create({
      data: {
        conversationId,
        messageId,
        command,
        intent: plan.intent,
        status: 'PENDING_APPROVAL',
        safetyMode: mode,
        planSummary: plan.summary,
        diffPreview: JSON.stringify(plan.diffPreview || {}),
        beforeState: JSON.stringify(plan.beforeState || {}),
        afterState: JSON.stringify(plan.afterState || {}),
        steps: {
          create: (plan.steps || []).map((step: any, idx: number) => ({
            stepOrder: idx + 1,
            title: step.title,
            toolName: step.toolName,
            status: 'PENDING',
          })),
        },
        approval: {
          create: {
            requestedBy: userId,
            decision: 'PENDING',
          },
        },
      },
      include: { steps: true, approval: true },
    });

    const promptMessage = mode === 'MODE_C'
      ? `🚨 **উচ্চ ঝুঁকিপূর্ণ অপারেশনের সম্মতি প্রয়োজন (Mode C):**\n${plan.summary}\n\nআপনার চূড়ান্ত অনুমোদনের পরই কেবল এই পরিবর্তন ডাটাবেসে সম্পন্ন হবে।`
      : `📋 **পরিকল্পনা ও প্রিভিউ প্রস্তুত (Mode B):**\n${plan.summary}\n\nনিচের প্রিভিউ কার্ডে পরিবর্তনগুলো দেখুন এবং অনুমোদনের জন্য **"অনুমোদন ও কার্যকর করুন"** বাটনে ক্লিক করুন।`;

    const aiReply = await prisma.aiMessage.create({
      data: {
        conversationId,
        sender: 'AI',
        content: promptMessage,
        tokensUsed: 75,
      },
    });

    return {
      conversationId,
      messageId: aiReply.id,
      responseContent: promptMessage,
      task: {
        id: task.id,
        intent: task.intent,
        status: task.status,
        safetyMode: mode,
        planSummary: task.planSummary,
        diffPreview: plan.diffPreview,
      },
    };
  }

  /**
   * Approve and execute an existing pending task
   */
  static async approveAndExecuteTask(taskId: string, adminUserId: string): Promise<any> {
    const task = await prisma.aiTask.findUnique({
      where: { id: taskId },
      include: { steps: true, approval: true },
    });

    if (!task) throw new Error('টাস্ক পাওয়া যায়নি।');
    if (task.status !== 'PENDING_APPROVAL') {
      throw new Error(`এই টাস্কটি ইতিমধ্যে ${task.status} অবস্থায় রয়েছে।`);
    }

    // Update status to EXECUTING
    await prisma.aiTask.update({
      where: { id: taskId },
      data: { status: 'EXECUTING' },
    });

    const executionResults = [];
    let rollbackData: any = null;

    for (const step of task.steps) {
      const tool = AI_TOOLS[step.toolName];
      if (tool) {
        const parsedParams = task.afterState ? JSON.parse(task.afterState) : {};
        const startTime = Date.now();
        const res = await tool.execute(parsedParams);
        const durationMs = Date.now() - startTime;

        if (res.rollbackPayload) {
          rollbackData = res.rollbackPayload;
        }

        await prisma.aiToolExecution.create({
          data: {
            taskId: task.id,
            toolName: step.toolName,
            inputParams: JSON.stringify(parsedParams),
            outputData: JSON.stringify(res.data || {}),
            isSuccess: res.success,
            durationMs,
          },
        });

        await prisma.aiTaskStep.update({
          where: { id: step.id },
          data: { status: res.success ? 'COMPLETED' : 'FAILED', result: JSON.stringify(res) },
        });

        executionResults.push(res);
      }
    }

    // Update Task & Approval to COMPLETED
    await prisma.aiApproval.updateMany({
      where: { taskId: task.id },
      data: {
        decision: 'APPROVED',
        approvedBy: adminUserId,
        decidedAt: new Date(),
      },
    });

    const completedTask = await prisma.aiTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        executedAt: new Date(),
        rollbackData: rollbackData ? JSON.stringify(rollbackData) : null,
      },
    });

    return {
      success: true,
      message: 'টাস্ক সফলভাবে কার্যকর করা হয়েছে এবং ওয়েবসাইটে প্রকাশ পেয়েছে!',
      task: completedTask,
      executionResults,
    };
  }

  /**
   * Reject a pending task
   */
  static async rejectTask(taskId: string, adminUserId: string, reason?: string): Promise<any> {
    await prisma.aiApproval.updateMany({
      where: { taskId },
      data: {
        decision: 'REJECTED',
        approvedBy: adminUserId,
        comment: reason || 'অ্যাডমিন কর্তৃক বাতিলকৃত',
        decidedAt: new Date(),
      },
    });

    const rejectedTask = await prisma.aiTask.update({
      where: { id: taskId },
      data: { status: 'REJECTED' },
    });

    return { success: true, message: 'টাস্কটি বাতিল করা হয়েছে।', task: rejectedTask };
  }

  /**
   * Rollback a completed task to its beforeState
   */
  static async rollbackTask(taskId: string, adminUserId: string): Promise<any> {
    const task = await prisma.aiTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('টাস্ক পাওয়া যায়নি।');
    if (task.status !== 'COMPLETED' || !task.rollbackData) {
      throw new Error('এই টাস্কটির কোনো রোলব্যাক ডেটা নেই অথবা এটি কম্প্লিট হয়নি।');
    }

    const payload = JSON.parse(task.rollbackData);
    const tool = AI_TOOLS[payload.action];
    if (!tool) throw new Error('রোলব্যাক টুল পাওয়া যায়নি।');

    await tool.execute(payload);

    const rolledBackTask = await prisma.aiTask.update({
      where: { id: taskId },
      data: { status: 'ROLLED_BACK' },
    });

    return { success: true, message: 'সফলভাবে আগের অবস্থায় ফিরিয়ে নেওয়া হয়েছে (Rolled Back)!', task: rolledBackTask };
  }

  /**
   * Robust NLP & Keyword Intent Analyzer with Context Engine
   */
  private static async detectIntentAndPlan(command: string, input: ProcessCommandInput): Promise<any> {
    const text = command.toLowerCase();

    // 1. Ramadan / Special Campaign Intent
    if (text.includes('রমজান') || text.includes('ramadan') || text.includes('ক্যাম্পেইন') || text.includes('campaign') || text.includes('ঈদ')) {
      const isRamadan = text.includes('রমজান') || text.includes('ramadan');
      return {
        intent: 'LAUNCH_CAMPAIGN',
        toolName: 'launch_promotional_campaign',
        summary: isRamadan
          ? 'মাহে রমজান ২০২৬ উপলক্ষে বিশেষ ক্যাম্পেইন: ২৫% ছাড়ের কুপন (RAMADAN25), আকর্ষণীয় হিরো ব্যানার এবং ফ্ল্যাশ সেল সেকশন উপরে স্থাপন।'
          : 'বিশেষ প্রমোশনাল ক্যাম্পেইন চালু করার পরিকল্পনা তৈরি করা হয়েছে।',
        parameters: {
          campaignName: isRamadan ? 'মাহে রমজান ২০২৬ বিশেষ অফার' : 'বিশেষ অফার ক্যাম্পেইন',
          couponCode: isRamadan ? 'RAMADAN25' : 'SPECIAL20',
          discountPercent: isRamadan ? 25 : 20,
          bannerHeadline: isRamadan ? 'মাহে রমজানের পবিত্র আলোয় আলোকিত হোক প্রতিটি ঘর' : 'বিশেষ আকর্ষণীয় বই ও পণ্যে অভাবনীয় ছাড়!',
          bannerSubhead: 'কুরআন, তাফসির, হাদিস ও ইসলামিক সাহিত্যের সমৃদ্ধ সংগ্রহে বিশেষ ছাড় উপভোগ করুন।',
          badgeText: isRamadan ? 'মাহে রমজান মুবারক' : 'বিশেষ অফার',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
        },
        diffPreview: {
          title: isRamadan ? 'মাহে রমজান ক্যাম্পেইন' : 'প্রমোশন ক্যাম্পেইন',
          coupon: isRamadan ? 'RAMADAN25 (২৫% ছাড়)' : 'SPECIAL20 (২০% ছাড়)',
          banner: 'নতুন হিরো স্লাইডার তৈরি হবে',
          sections: 'ফ্ল্যাশ সেল ও ইসলামিক বই সেকশন অগ্রাধিকার পাবে',
        },
        afterState: {
          campaignName: isRamadan ? 'মাহে রমজান ২০২৬ বিশেষ অফার' : 'বিশেষ অফার ক্যাম্পেইন',
          couponCode: isRamadan ? 'RAMADAN25' : 'SPECIAL20',
          discountPercent: isRamadan ? 25 : 20,
          bannerHeadline: isRamadan ? 'মাহে রমজানের পবিত্র আলোয় আলোকিত হোক প্রতিটি ঘর' : 'বিশেষ আকর্ষণীয় বই ও পণ্যে অভাবনীয় ছাড়!',
          bannerSubhead: 'কুরআন, তাফসির, হাদিস ও ইসলামিক সাহিত্যের সমৃদ্ধ সংগ্রহে বিশেষ ছাড় উপভোগ করুন।',
          badgeText: isRamadan ? 'মাহে রমজান মুবারক' : 'বিশেষ অফার',
        },
        steps: [{ title: 'কুপন তৈরি ও হিরো ব্যানার পাবলিশ', toolName: 'launch_promotional_campaign' }],
      };
    }

    // 2. Modernize / Redesign Website Intent
    if (text.includes('আধুনিক') || text.includes('modern') || text.includes('সাজাও') || text.includes('redesign') || text.includes('হোমপেজ')) {
      return {
        intent: 'REORDER_HOMEPAGE',
        toolName: 'reorder_homepage_sections',
        summary: 'হোমপেজ আধুনিকায়ন পরিকল্পনা: হিরো স্লাইডারের পরপরই ক্যাটাগরি গ্রিড, বিশেষ নির্বাচিত বই এবং ডিজিটাল লাইব্রেরী শীর্ষ অবস্থানে নিয়ে আসা।',
        parameters: {
          orderMapping: [
            { sectionKey: 'slider', displayOrder: 1 },
            { sectionKey: 'categories', displayOrder: 2 },
            { sectionKey: 'featured_books', displayOrder: 3 },
            { sectionKey: 'digital_library', displayOrder: 4 },
            { sectionKey: 'flash_sale', displayOrder: 5 },
            { sectionKey: 'islamic_books', displayOrder: 6 },
          ],
        },
        diffPreview: {
          reorderedSections: [
            { name: 'হিরো প্রমোশনাল স্লাইডার', newOrder: 1 },
            { name: 'জনপ্রিয় বিষয় ও বিভাগসমূহ', newOrder: 2 },
            { name: 'নির্বাচিত বই ও সেরা সংকলন', newOrder: 3 },
            { name: 'ডিজিটাল লাইব্রেরী ও উন্মুক্ত পাঠ', newOrder: 4 },
          ],
        },
        afterState: {
          orderMapping: [
            { sectionKey: 'slider', displayOrder: 1 },
            { sectionKey: 'categories', displayOrder: 2 },
            { sectionKey: 'featured_books', displayOrder: 3 },
            { sectionKey: 'digital_library', displayOrder: 4 },
            { sectionKey: 'flash_sale', displayOrder: 5 },
            { sectionKey: 'islamic_books', displayOrder: 6 },
          ],
        },
        steps: [{ title: 'হোমপেজ সেকশনগুলোর আধুনিক ক্রমবিন্যাস', toolName: 'reorder_homepage_sections' }],
      };
    }

    // 3. Low Stock / Inventory Audit Intent
    if (text.includes('স্টক') || text.includes('stock') || text.includes('ইনভেন্টরি') || text.includes('inventory')) {
      return {
        intent: 'LOW_STOCK_AUDIT',
        toolName: 'analyze_inventory_and_low_stock',
        summary: 'ইনভেন্টরি ও স্টক লেভেল বিশ্লেষণ করা হচ্ছে...',
        parameters: { threshold: 5 },
      };
    }

    // 4. Duplicate Products Detection Intent
    if (text.includes('ডুপ্লিকেট') || text.includes('duplicate')) {
      return {
        intent: 'DETECT_DUPLICATE_PRODUCTS',
        toolName: 'detect_duplicate_products',
        summary: 'ডাটাবেসে সম্ভাব্য ডুপ্লিকেট বই পরীক্ষা করা হচ্ছে...',
        parameters: {},
      };
    }

    // 5. SEO Audit Intent
    if (text.includes('এসইও') || text.includes('seo') || text.includes('মেটা') || text.includes('meta')) {
      return {
        intent: 'AUDIT_SEO',
        toolName: 'audit_seo_metadata',
        summary: 'ওয়েবসাইটের এসইও স্বাস্থ্য ও মেটাডাটা স্ক্যান করা হচ্ছে...',
        parameters: {},
      };
    }

    // 6. Broken Links & Images Scan
    if (text.includes('ব্রোকেন') || text.includes('broken') || text.includes('ছবি') || text.includes('image') || text.includes('missing')) {
      return {
        intent: 'DETECT_BROKEN_LINKS',
        toolName: 'detect_broken_links_and_missing_images',
        summary: 'অনুপস্থিত ছবি ও লিঙ্ক স্ক্যান করা হচ্ছে...',
        parameters: {},
      };
    }

    // 7. Sales Performance Report Intent
    if (text.includes('বিক্রয়') || text.includes('sales') || text.includes('রিপোর্ট') || text.includes('report') || text.includes('রাজস্ব')) {
      return {
        intent: 'SALES_TREND_REPORT',
        toolName: 'generate_sales_performance_report',
        summary: 'সাম্প্রতিক বিক্রয় ও রাজস্ব তথ্য বিশ্লেষণ করা হচ্ছে...',
        parameters: { periodDays: 30 },
      };
    }

    // 8. Create Coupon Intent
    if (text.includes('কুপন') || text.includes('coupon') || text.includes('ডিসকাউন্ট') || text.includes('discount')) {
      return {
        intent: 'CREATE_COUPON',
        toolName: 'create_coupon',
        summary: 'নতুন কুপন তৈরির প্রস্তাবনা প্রস্তুত করা হয়েছে।',
        parameters: {
          code: 'SHUBBANPROMO',
          discountType: 'PERCENTAGE',
          amount: 15,
          minPurchase: 500,
        },
        diffPreview: {
          code: 'SHUBBANPROMO',
          discount: '১৫% ছাড়',
          minOrder: '৳৫০০',
        },
        afterState: {
          code: 'SHUBBANPROMO',
          discountType: 'PERCENTAGE',
          amount: 15,
          minPurchase: 500,
        },
        steps: [{ title: 'কুপন কোড ডাটাবেসে সেভ করা', toolName: 'create_coupon' }],
      };
    }

    // 9. General Question / Assistant Response Fallback
    return {
      intent: 'GENERAL_INQUIRY',
      toolName: null,
      summary: `আমি আপনার নির্দেশনাটি বিশ্লেষণ করেছি: "${command}"।\n\nআপনি নিম্নলিখিত কাজগুলো আমাকে দিয়ে সরাসরি করাতে পারেন:\n1. 🛍️ **ক্যাম্পেইন চালু:** "রমজান উপলক্ষে ক্যাম্পেইন তৈরি করো"\n2. 🎨 **হোমপেজ সাজানো:** "হোমপেজ আধুনিকায়ন করো"\n3. 📦 **স্টক বিশ্লেষণ:** "স্টক কম থাকা বইগুলোর রিপোর্ট দাও"\n4. 🔍 **এসইও অডিট:** "এসইও মেটা পরীক্ষা করো"\n5. 🏷️ **কুপন তৈরি:** "নতুন কুপন কোড বানাও"`,
      parameters: {},
    };
  }
}


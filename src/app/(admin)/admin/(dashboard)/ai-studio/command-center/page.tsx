import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import AiStudioCommandCenterClient from '@/components/admin/ai-studio/AiStudioCommandCenterClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'এআই কমান্ড সেন্টার | শুভ্বান এআই স্টুডিও',
  description: 'স্বয়ংক্রিয় কমান্ড এক্সিকিউশন, ডিফারেনশিয়াল প্রিভিউ ও সেফটি মোড ওয়ার্কফ্লো',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioCommandCenterPage() {
  const session = await getSessionUser();
  if (!session || !isAdmin(session.role)) {
    redirect('/admin/login?redirect=/admin/ai-studio/command-center');
  }

  // 1. Fetch or create active conversation
  let conversation = await prisma.aiConversation.findFirst({
    where: { userId: session.id, agentKey: 'website-ai' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          task: {
            include: { steps: true, approval: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.aiConversation.create({
      data: {
        userId: session.id,
        agentKey: 'website-ai',
        title: 'শুব্বান অটোনোমাস কমান্ড সেশন',
        messages: {
          create: [
            {
              sender: 'AI',
              agentKey: 'website-ai',
              content:
                'আসসালামু আলাইকুম! আমি শুব্বান এআই কমান্ড সেন্টারের ওয়েবসাইট ম্যানেজমেন্ট এজেন্ট। আপনি আমাকে প্রাকৃতিক বাংলায় যে-কোনো অপারেশনাল নির্দেশনা দিতে পারেন — যেমন: "রমজান উপলক্ষে ক্যাম্পেইন তৈরি করো", "হোমপেজের ব্যানার সাজাও", "স্টক কম থাকা বইগুলোর রিপোর্ট দাও" বা "নতুন কুপন কোড তৈরি করো"। আমি তাৎক্ষণিকভাবে পরিকল্পনা ও ডিফারেনশিয়াল প্রিভিউ তৈরি করে আপনার অনুমোদনের ভিত্তিতে তা বাস্তবায়ন করব।',
              tokensUsed: 65,
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            task: {
              include: { steps: true, approval: true },
            },
          },
        },
      },
    });
  }

  // 2. Fetch Aggregated Metrics
  const [
    totalTasks,
    completedTasks,
    pendingApprovals,
    failedTasks,
    totalTokensResult,
    providers,
    recentTasks,
  ] = await Promise.all([
    prisma.aiTask.count(),
    prisma.aiTask.count({ where: { status: 'COMPLETED' } }),
    prisma.aiApproval.count({ where: { decision: 'PENDING' } }),
    prisma.aiTask.count({ where: { status: 'FAILED' } }),
    prisma.aiMessage.aggregate({
      _sum: { tokensUsed: true },
    }),
    prisma.aiProviderConfig.findMany({
      orderBy: { isDefault: 'desc' },
    }),
    prisma.aiTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        intent: true,
        command: true,
        status: true,
        safetyMode: true,
        createdAt: true,
      },
    }),
  ]);

  const totalTokens = totalTokensResult._sum.tokensUsed || 0;
  const estimatedCostUsd = (totalTokens / 1000) * 0.002;

  const stats = {
    metrics: {
      totalTasks,
      completedTasks,
      pendingApprovals,
      failedTasks,
      totalTokens,
      estimatedCostUsd,
    },
    providers: providers.map((p) => ({
      providerKey: p.providerKey,
      name: p.name,
      isEnabled: p.isActive,
      modelName: p.modelsSupported ? JSON.parse(p.modelsSupported)[0] || 'default' : 'default',
    })),
    recentTasks: JSON.parse(JSON.stringify(recentTasks)),
  };

  const initialConversation = {
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      sender: m.sender as 'USER' | 'AI' | 'SYSTEM',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      task: m.task
        ? {
          id: m.task.id,
          intent: m.task.intent,
          status: m.task.status,
          safetyMode: m.task.safetyMode,
          planSummary: m.task.planSummary,
          diffPreview: m.task.diffPreview ? JSON.parse(m.task.diffPreview) : null,
          steps: m.task.steps,
        }
        : null,
    })),
  };

  return (
    <div className="space-y-6">
      <AiStudioCommandCenterClient
        initialConversation={JSON.parse(JSON.stringify(initialConversation))}
        stats={stats}
      />
    </div>
  );
}

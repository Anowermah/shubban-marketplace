import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import AdminAiAssistantClient from '@/components/admin/AdminAiAssistantClient';

export const dynamic = 'force-dynamic';

export default async function AdminAiAssistantPage() {
  const session = await getSessionUser();
  if (!session || !isAdmin(session.role)) {
    redirect('/admin/login?redirect=/admin/ai-assistant');
  }

  // 1. Fetch or create active conversation
  let conversation = await prisma.aiConversation.findFirst({
    where: { userId: session.id },
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
        title: 'শুব্বান অটোনোমাস কমান্ড সেশন',
        messages: {
          create: [
            {
              sender: 'AI',
              content:
                'আসসালামু আলাইকুম! আমি শুব্বান লাইব্রেরী অটোনোমাস ম্যানেজমেন্ট সিস্টেম। আপনি আমাকে বাংলা বা ইংরেজিতে যে-কোনো নির্দেশনা দিতে পারেন — যেমন: "রমজান উপলক্ষে ক্যাম্পেইন তৈরি করো", "হোমপেজের ব্যানার সাজাও", "স্টক কম থাকা বইগুলোর রিপোর্ট দাও" বা "নতুন কুপন কোড তৈরি করো"। আমি স্বয়ংক্রিয়ভাবে পরিকল্পনা তৈরি করে আপনার অনুমোদনের পর তা ওয়েবসাইটে বাস্তবায়ন করব।',
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

  // 2. Fetch AI Metrics & Provider Settings
  const [
    totalTasks,
    completedTasks,
    pendingApprovals,
    failedTasks,
    recentTasks,
    providers,
    totalUsage,
  ] = await Promise.all([
    prisma.aiTask.count(),
    prisma.aiTask.count({ where: { status: 'COMPLETED' } }),
    prisma.aiTask.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.aiTask.count({ where: { status: 'FAILED' } }),
    prisma.aiTask.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { approval: true },
    }),
    prisma.aiProviderSetting.findMany({
      select: { providerKey: true, name: true, isEnabled: true, modelName: true },
    }),
    prisma.aiUsageLog.aggregate({
      _sum: { promptTokens: true, compTokens: true, totalCostUsd: true },
    }),
  ]);

  const totalTokens =
    (totalUsage._sum.promptTokens || 0) + (totalUsage._sum.compTokens || 0);

  const stats = {
    metrics: {
      totalTasks,
      completedTasks,
      pendingApprovals,
      failedTasks,
      totalTokens,
      estimatedCostUsd: totalUsage._sum.totalCostUsd || 0,
    },
    providers,
    recentTasks,
  };

  return (
    <div className="font-bengali">
      <AdminAiAssistantClient
        initialConversation={{
          id: conversation.id,
          title: conversation.title,
          messages: conversation.messages as any,
        }}
        stats={stats}
      />
    </div>
  );
}


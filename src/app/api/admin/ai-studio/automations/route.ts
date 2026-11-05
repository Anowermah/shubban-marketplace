import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

const DEFAULT_WORKFLOWS = [
  {
    name: 'দৈনিক বিক্রয় ও ইনভেন্টরি ডাইজেস্ট',
    description: 'প্রতিদিন সকাল ৮টায় বিগত দিনের বিক্রয়, নতুন অর্ডার ও পেন্ডিং শিপমেন্টের সংক্ষিপ্ত রিপোর্ট প্রস্তুত করে।',
    triggerType: 'SCHEDULE',
    cronExpression: '0 8 * * *',
    actionType: 'REPORT',
    agentKey: 'business-ai',
    status: 'ACTIVE',
    isEnabled: true,
  },
  {
    name: 'স্বল্প স্টক স্বয়ংক্রিয় সতর্কবার্তা',
    description: 'স্টক ৫ বা তার নিচে নেমে যাওয়া বই শনাক্ত করে প্রকাশকদের রি-স্টক অ্যালার্ট প্রস্তুত করে।',
    triggerType: 'SCHEDULE',
    cronExpression: '0 */6 * * *',
    actionType: 'AUDIT',
    agentKey: 'marketplace-ai',
    status: 'ACTIVE',
    isEnabled: true,
  },
  {
    name: 'ম্যাগাজিন প্রকাশনা ও সম্পাদকীয় ডেডলাইন রিমাইন্ডার',
    description: 'আসন্ন সংখ্যার প্রবন্ধ জমা ও প্রুফরিডিংয়ের চূড়ান্ত সময়সীমা সম্পর্কে সম্পাদকীয় দলকে অবহিত করে।',
    triggerType: 'SCHEDULE',
    cronExpression: '0 9 * * 1',
    actionType: 'REMINDER',
    agentKey: 'magazine-ai',
    status: 'ACTIVE',
    isEnabled: true,
  },
  {
    name: 'এসইও মেটা অপ্টিমাইজেশন ও ইনডেক্সিং অডিট',
    description: 'নতুন প্রকাশিত বই ও প্রবন্ধগুলোর এসইও মেটাডাটা মানসম্মত কিনা তা স্বয়ংক্রিয়ভাবে অডিট করে।',
    triggerType: 'SCHEDULE',
    cronExpression: '0 0 * * 5',
    actionType: 'AUDIT',
    agentKey: 'seo-ai',
    status: 'PAUSED',
    isEnabled: false,
  },
];

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    let workflows = await prisma.aiAutomationWorkflow.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (workflows.length === 0) {
      for (const wf of DEFAULT_WORKFLOWS) {
        await prisma.aiAutomationWorkflow.create({ data: wf });
      }
      workflows = await prisma.aiAutomationWorkflow.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, workflows });
  } catch (error: any) {
    console.error('Fetch Automations Error:', error);
    return NextResponse.json({ error: 'অটোমেশন তালিকা আনতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { action, id, name, description, triggerType, cronSchedule, actionIntent, agentKey } = body;

    if (action === 'RUN_NOW' && id) {
      const updated = await prisma.aiAutomationWorkflow.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'SUCCESS',
          executionCount: { increment: 1 },
        },
      });
      return NextResponse.json({ success: true, workflow: updated });
    }

    if (!name || !actionIntent) {
      return NextResponse.json({ error: 'নাম ও অ্যাকশন টাইপ আবশ্যক' }, { status: 400 });
    }

    const created = await prisma.aiAutomationWorkflow.create({
      data: {
        name,
        description,
        triggerType: triggerType || 'SCHEDULE',
        cronExpression: cronSchedule || '0 9 * * *',
        actionType: actionIntent || 'REPORT',
        agentKey: agentKey || 'general-ai',
        status: 'ACTIVE',
        isEnabled: true,
      },
    });

    return NextResponse.json({ success: true, workflow: created });
  } catch (error: any) {
    console.error('Create Automation Error:', error);
    return NextResponse.json({ error: error?.message || 'অটোমেশন তৈরি করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { id, isEnabled } = body;

    if (!id || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'অবৈধ প্যারামিটার' }, { status: 400 });
    }

    const updated = await prisma.aiAutomationWorkflow.update({
      where: { id },
      data: {
        isEnabled,
        status: isEnabled ? 'ACTIVE' : 'PAUSED',
      },
    });

    return NextResponse.json({ success: true, workflow: updated });
  } catch (error: any) {
    console.error('Update Automation Error:', error);
    return NextResponse.json({ error: error?.message || 'আপডেট করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

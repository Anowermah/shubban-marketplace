import { NextResponse } from 'next/server';
import { IslamicRagEngine } from '@/lib/islamic-ai/rag-engine';
import { getSessionUser } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import {
  getIslamicAiSettings,
  validateIslamicPromptSafety,
  checkDailyQuota,
} from '@/lib/islamic-ai/settings';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    const clientIp = getClientIp(req);
    const body = await req.json();
    const { query, language, mode, conversationId, sessionId } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'প্রশ্ন প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    // 1. Fetch AI Access Governance Settings
    const settings = await getIslamicAiSettings();

    // 2. Check Public AI Status
    if (!settings.publicAiEnabled) {
      return NextResponse.json(
        { error: 'ইসলামিক এআই সেবাটি বর্তমানে প্ল্যাটফর্ম পরিচালকের নির্দেশনায় বন্ধ রয়েছে।' },
        { status: 503 }
      );
    }

    // 3. Check Maintenance Mode
    if (settings.maintenanceMode) {
      return NextResponse.json(
        { error: settings.maintenanceMessage },
        { status: 503 }
      );
    }

    // 4. Check Guest Access Permission
    const isGuest = !session?.id;
    if (isGuest && !settings.guestAccessEnabled) {
      return NextResponse.json(
        {
          error: 'বর্তমানে শুধুমাত্র নিবন্ধিত ব্যবহারকারীদের জন্য ইসলামিক এআই উন্মুক্ত রয়েছে। অনুগ্রহ করে লগইন করুন।',
          requiresLogin: true,
        },
        { status: 401 }
      );
    }

    // 5. Prompt Injection & Security Guardrails
    const safetyCheck = validateIslamicPromptSafety(query);
    if (!safetyCheck.isSafe) {
      return NextResponse.json(
        { error: safetyCheck.reason },
        { status: 400 }
      );
    }

    // 6. Sliding Window Rate Limiting (10 requests per minute per IP / Session)
    const rateLimitKey = session?.id ? `user:${session.id}` : `guest:${sessionId || clientIp}`;
    const rl = rateLimit(rateLimitKey, {
      limit: 10,
      windowMs: 60 * 1000,
      prefix: 'islamic_ai',
    });

    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'আপনি খুব দ্রুত প্রশ্ন করছেন। অনুগ্রহ করে এক মিনিট অপেক্ষা করে পুনরায় প্রশ্ন করুন।',
          retryAfter: Math.ceil((rl.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // 7. Daily Quota Check
    const effectiveSessionId = sessionId || `guest_${clientIp.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const quota = await checkDailyQuota(
      { userId: session?.id || null, sessionId: effectiveSessionId },
      settings
    );

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: isGuest
            ? `গেস্ট ব্যবহারকারী হিসেবে আপনার দৈনিক ${settings.guestDailyLimit}টি প্রশ্নের কোটা শেষ হয়েছে। আনলিমিটেড প্রশ্ন করতে বিনামূল্যে লগইন বা রেজিস্ট্রেশন করুন।`
            : `আপনার দৈনিক ${settings.registeredDailyLimit}টি প্রশ্নের নির্ধারিত কোটা পূর্ণ হয়েছে। আগামীকাল পুনরায় প্রশ্ন করতে পারবেন।`,
          quotaExceeded: true,
          used: quota.used,
          limit: quota.limit,
        },
        { status: 429 }
      );
    }

    // 8. Grounded Execution via Islamic RAG Engine
    const response = await IslamicRagEngine.answerQuestion({
      query: query.trim(),
      language,
      mode: mode === 'RESEARCH' ? 'RESEARCH' : 'STANDARD',
      conversationId: conversationId || null,
      sessionId: isGuest ? effectiveSessionId : null,
      userId: session?.id || null,
    });

    return NextResponse.json({
      ...response,
      quotaRemaining: quota.remaining - 1,
    });
  } catch (error: any) {
    console.error('Islamic AI Query Error:', error);
    return NextResponse.json(
      { error: error.message || 'ইসলামিক এআই উত্তর প্রক্রিয়ায় ত্রুটি ঘটেছে' },
      { status: 500 }
    );
  }
}

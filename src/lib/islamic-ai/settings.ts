/**
 * Islamic AI Assistant Settings, Guardrails & Access Governance
 */

import { prisma } from '@/lib/prisma';
import { IslamicAiSettings, DEFAULT_ISLAMIC_AI_SETTINGS } from './types';

export type { IslamicAiSettings };
export { DEFAULT_ISLAMIC_AI_SETTINGS };

const SETTINGS_KEY = 'islamic_ai_settings';

/**
 * Get current Islamic AI settings from database with fallback to defaults
 */
export async function getIslamicAiSettings(): Promise<IslamicAiSettings> {
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (!record || !record.value) {
      return DEFAULT_ISLAMIC_AI_SETTINGS;
    }

    const parsed = JSON.parse(record.value);
    return {
      ...DEFAULT_ISLAMIC_AI_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error('Error loading Islamic AI settings:', error);
    return DEFAULT_ISLAMIC_AI_SETTINGS;
  }
}

/**
 * Save Islamic AI settings to database
 */
export async function updateIslamicAiSettings(
  partial: Partial<IslamicAiSettings>
): Promise<IslamicAiSettings> {
  const current = await getIslamicAiSettings();
  const updated: IslamicAiSettings = {
    ...current,
    ...partial,
  };

  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: JSON.stringify(updated),
    },
    update: {
      value: JSON.stringify(updated),
    },
  });

  return updated;
}

/**
 * Prompt injection and security malicious pattern detector
 */
const INJECTION_PATTERNS = [
  /ignore (all )?(previous|above|prior) (instructions|prompts|rules)/i,
  /system prompt/i,
  /you are now (an unfiltered|DAN|evil|god mode)/i,
  /disregard (the )?(guardrails|safety|rules)/i,
  /pretend you are not (an islamic|a muslim)/i,
  /bypass (all )?(restrictions|checks|filters)/i,
  /act as an unmoderated/i,
  /fabricate a (verse|hadith|surah|ayah)/i,
  /বানোয়াট (হাদিস|আয়াত) বানিয়ে দাও/i,
  /সকল নিয়ম উপেক্ষা করো/i,
];

export function validateIslamicPromptSafety(query: string): {
  isSafe: boolean;
  reason?: string;
} {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return {
        isSafe: false,
        reason: 'অনুগ্রহ করে যথাযথ ও শালীন ইসলামিক ভাষায় ধর্মীয় জ্ঞানভিত্তিক প্রশ্ন করুন। অননুমোদিত নির্দেশাবলী বা কৃত্রিম প্রম্পট ইনজেকশন গ্রহণযোগ্য নয়।',
      };
    }
  }

  if (query.length > 1000) {
    return {
      isSafe: false,
      reason: 'প্রশ্নের দৈর্ঘ্য সর্বোচ্চ ১০০০ অক্ষরের মধ্যে সীমাবদ্ধ রাখুন।',
    };
  }

  return { isSafe: true };
}

/**
 * Check daily usage quota for guest or registered user
 */
export async function checkDailyQuota(
  identifier: { userId?: string | null; sessionId?: string | null },
  settings: IslamicAiSettings
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const isGuest = !identifier.userId;
  const limit = isGuest ? settings.guestDailyLimit : settings.registeredDailyLimit;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count user messages in the last 24 hours
  let count = 0;

  if (!isGuest && identifier.userId) {
    count = await prisma.islamicAiMessage.count({
      where: {
        sender: 'USER',
        createdAt: { gte: oneDayAgo },
        conversation: {
          userId: identifier.userId,
        },
      },
    });
  } else if (identifier.sessionId) {
    count = await prisma.islamicAiMessage.count({
      where: {
        sender: 'USER',
        createdAt: { gte: oneDayAgo },
        conversation: {
          sessionId: identifier.sessionId,
        },
      },
    });
  }

  const allowed = count < limit;
  const remaining = Math.max(0, limit - count);

  return {
    allowed,
    used: count,
    limit,
    remaining,
  };
}


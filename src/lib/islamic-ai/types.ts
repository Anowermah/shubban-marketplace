/**
 * Pure Client-Safe Types & Constants for Islamic AI Assistant
 * 
 * IMPORTANT: No server-side imports (Prisma, fs, child_process, auth)
 * allowed in this file so that it can be safely imported by client components.
 */

export interface IslamicAiSettings {
  publicAiEnabled: boolean;
  guestAccessEnabled: boolean;
  guestDailyLimit: number;
  registeredDailyLimit: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  selectedModel: string;
  temperature: number;
  strictDalilOnly: boolean;
  systemPrompt: string;
}

export const DEFAULT_ISLAMIC_AI_SETTINGS: IslamicAiSettings = {
  publicAiEnabled: true,
  guestAccessEnabled: true,
  guestDailyLimit: 15,
  registeredDailyLimit: 100,
  maintenanceMode: false,
  maintenanceMessage: 'ইসলামিক এআই বর্তমানে রক্ষণাবেক্ষণ ও ডাটাবেস হালনাগাদের জন্য সাময়িকভাবে স্থগিত রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
  selectedModel: 'gemini-1.5-pro',
  temperature: 0.2,
  strictDalilOnly: true,
  systemPrompt: `You are the Shubban Library Verified Islamic AI Assistant. Answer questions strictly grounded in the Holy Quran, authentic Sunnah (Sahih/Hasan hadiths), and classic Tafsir. Never fabricate verses or hadith numbers. State 'Insufficient evidence' when reliable source text is not found. Avoid issuing definitive personal Fatwas.`,
};

export interface IslamicQueryInput {
  query: string;
  language?: 'bn' | 'en' | 'ar';
  mode?: 'STANDARD' | 'RESEARCH';
  userId?: string | null;
  sessionId?: string | null;
  conversationId?: string | null;
}

export interface GroundedCitation {
  sourceType: 'QURAN' | 'HADITH' | 'TAFSIR' | 'SCHOLARLY';
  referenceId: string;
  title: string;
  arabicText?: string;
  translation: string;
  grading?: string;
  sourceBook: string;
  url?: string;
}

export interface GroundedIslamicResponse {
  conversationId: string;
  messageId: string;
  summaryAnswer: string;
  evidenceStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'INSUFFICIENT_EVIDENCE';
  mode: 'STANDARD' | 'RESEARCH';
  language: 'bn' | 'en' | 'ar';
  quranEvidence?: {
    surahNameBn: string;
    surahNameAr: string;
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    translationBn: string;
    translationEn?: string;
    tafsirExcerpt?: string;
    tafsirSource?: string;
  };
  hadithEvidence?: {
    collectionNameBn: string;
    collectionNameAr: string;
    hadithNumber: number;
    arabicText: string;
    translationBn: string;
    narrator?: string;
    authenticity: string;
    gradingAuthority: string;
    sourceUrl?: string;
  };
  scholarlyContext?: {
    topic: string;
    hanafi?: string | null;
    maliki?: string | null;
    shafii?: string | null;
    hanbali?: string | null;
    consensusNotes?: string | null;
    classicalSources?: string | null;
  };
  recommendedBooks: Array<{
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    price: number;
    discountPrice?: number | null;
    authorName: string;
  }>;
  citations: GroundedCitation[];
  disclaimer: string;
  quotaRemaining?: number;
}


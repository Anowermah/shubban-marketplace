/**
 * Islamic AI Live Consultation & Shaykh Hotline Management
 * 
 * Provides:
 * 1. Admin controls to assign Shaykhs / Muftis to on-duty consultation
 * 2. WhatsApp direct consultation integration
 * 3. Live chat hotline roster with availability schedules
 */

import { prisma } from '@/lib/prisma';

export interface ShaykhHotlineItem {
  id: string;
  name: string; // e.g. "মুফতী মুহাম্মদ যাইনুল আবেদীন"
  title: string; // e.g. "সিনিয়র ইফতা গবেষক ও মুফতী"
  specialization: string; // e.g. "আধুনিক লেনদেন, যাকাত ও সমসাময়িক ফিকহ"
  institution: string; // e.g. "মারকাযুল বুহুস আল-ইসলামিয়া"
  phone?: string; // Hotline phone e.g. "+880 1711-000000"
  whatsappNumber: string; // Clean number for wa.me e.g. "8801711000000"
  avatarUrl?: string; // Profile picture
  dutySchedule: string; // e.g. "শনি - বৃহস্পতি: সকাল ১০টা - দুপুর ১টা এবং বিকাল ৫টা - রাত ৯টা"
  isOnDuty: boolean; // Currently assigned to take consultations
  isLiveChatActive: boolean; // Accepts real-time chat
  status: 'ONLINE' | 'BUSY' | 'ON_BREAK' | 'OFFLINE';
  bio?: string;
  priorityOrder: number;
  totalConsultations: number;
}

export interface IslamicHotlineGlobalConfig {
  hotlineEnabled: boolean;
  whatsappEnabled: boolean;
  liveChatEnabled: boolean;
  primaryHotlinePhone: string;
  defaultWhatsappNumber: string;
  whatsappDefaultMessage: string;
  noticeBannerText: string;
}

export const DEFAULT_HOTLINE_CONFIG: IslamicHotlineGlobalConfig = {
  hotlineEnabled: true,
  whatsappEnabled: true,
  liveChatEnabled: true,
  primaryHotlinePhone: '+880 1711-000000',
  defaultWhatsappNumber: '8801711000000',
  whatsappDefaultMessage: 'আসসালামু আলাইকুম। আমি শুব্বান লাইব্রেরী থেকে একটি জরুরি ইসলামিক মাসআলা / ফতোয়া বিষয়ে শাইখের পরামর্শ চাই।',
  noticeBannerText: 'জরুরি ফতোয়া, জটিল পারিবারিক বা আর্থিক মাসআলার জন্য আমাদের অভিজ্ঞ মুফতী ও শাইখদের সাথে সরাসরি WhatsApp বা হটলাইনে কথা বলুন।',
};

export const DEFAULT_SHAYKH_ROSTER: ShaykhHotlineItem[] = [
  {
    id: 'shaykh-1',
    name: 'মুফতী মুহাম্মদ যাইনুল আবেদীন',
    title: 'সিনিয়র ইফতা গবেষক ও প্রধান মুফতী',
    specialization: 'আধুনিক আর্থিক লেনদেন, ব্যবসা-বাণিজ্য ও ইসলামিক ব্যাংকিং',
    institution: 'মারকাযুল বুহুস আল-ইসলামিয়া ও দারুল উলুম',
    phone: '+880 1711-100001',
    whatsappNumber: '8801711100001',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
    dutySchedule: 'শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - দুপুর ১:০০',
    isOnDuty: true,
    isLiveChatActive: true,
    status: 'ONLINE',
    bio: 'আন্তর্জাতিক ইসলামিক ফিকহ একাডেমি এবং জাতীয় ফতোয়া বোর্ডের সম্মানিত সদস্য। ২০ বছরের অধিক সময় ধরে ফতোয়া ও দারুল ইফতা পরিচালনা করছেন।',
    priorityOrder: 1,
    totalConsultations: 1420,
  },
  {
    id: 'shaykh-2',
    name: 'মাওলানা মুফতী আব্দুল্লাহ আল-মাসউদ',
    title: 'ফতোয়া ও দাওয়াহ বিভাগীয় প্রধান',
    specialization: 'ইবাদত, সাওম, হজ্ব, যাকাত ও পারিবারিক উত্তরাধিকার (মীরাস)',
    institution: 'জামিয়া শারইয়্যাহ ও মদিনা ইসলামিক একাডেমি',
    phone: '+880 1711-100002',
    whatsappNumber: '8801711100002',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    dutySchedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০',
    isOnDuty: true,
    isLiveChatActive: true,
    status: 'ONLINE',
    bio: 'মদিনা ইসলামিক বিশ্ববিদ্যালয় থেকে উচ্চতর ফিকহ সনদপ্রাপ্ত। পারিবারিক বিরোধ ও পারিবারিক মাসআলা সংক্রান্ত অভিজ্ঞ পরামর্শক।',
    priorityOrder: 2,
    totalConsultations: 980,
  },
  {
    id: 'shaykh-3',
    name: 'মুফতী আবু বকর সিদ্দিক',
    title: 'হাদিস ও তাহকিক বিশেষজ্ঞ',
    specialization: 'বিশুদ্ধ হাদিস যাচাই, আকিদা ও সমসাময়িক আধুনিক সংশয় নিরসন',
    institution: 'দারুল হাদিস রিসার্চ সেন্টার',
    phone: '+880 1711-100003',
    whatsappNumber: '8801711100003',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    dutySchedule: 'রবিবার - বুধবার: রাত ৮:০০ - রাত ১০:৩০',
    isOnDuty: false,
    isLiveChatActive: false,
    status: 'OFFLINE',
    bio: 'হাদিস শাস্ত্রের সানাদ ও মতনের প্রামাণিক বিশ্লেষণ গবেষক। বিভিন্ন জাতীয় জার্নালে প্রকাশিত বহু মৌলিক গ্রন্থের লেখক।',
    priorityOrder: 3,
    totalConsultations: 640,
  },
];

const CONFIG_KEY = 'islamic_hotline_config';
const ROSTER_KEY = 'islamic_scholar_roster';

/**
 * Fetch full hotline configuration and roster (Admin & Public)
 */
export async function getIslamicHotlineData(): Promise<{
  config: IslamicHotlineGlobalConfig;
  roster: ShaykhHotlineItem[];
}> {
  try {
    const [configRecord, rosterRecord] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: CONFIG_KEY } }),
      prisma.siteSetting.findUnique({ where: { key: ROSTER_KEY } }),
    ]);

    let config: IslamicHotlineGlobalConfig = DEFAULT_HOTLINE_CONFIG;
    if (configRecord && configRecord.value) {
      try {
        config = { ...DEFAULT_HOTLINE_CONFIG, ...JSON.parse(configRecord.value) };
      } catch {}
    }

    let roster: ShaykhHotlineItem[] = DEFAULT_SHAYKH_ROSTER;
    if (rosterRecord && rosterRecord.value) {
      try {
        roster = JSON.parse(rosterRecord.value);
      } catch {}
    } else {
      // Seed initial roster into database
      await prisma.siteSetting.upsert({
        where: { key: ROSTER_KEY },
        update: { value: JSON.stringify(DEFAULT_SHAYKH_ROSTER) },
        create: { key: ROSTER_KEY, value: JSON.stringify(DEFAULT_SHAYKH_ROSTER) },
      });
    }

    return { config, roster };
  } catch (error) {
    console.error('Error getting Islamic hotline data:', error);
    return { config: DEFAULT_HOTLINE_CONFIG, roster: DEFAULT_SHAYKH_ROSTER };
  }
}

/**
 * Save Hotline Configuration
 */
export async function saveIslamicHotlineConfig(
  config: Partial<IslamicHotlineGlobalConfig>
): Promise<IslamicHotlineGlobalConfig> {
  const current = (await getIslamicHotlineData()).config;
  const merged = { ...current, ...config };

  await prisma.siteSetting.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: CONFIG_KEY, value: JSON.stringify(merged) },
  });

  return merged;
}

/**
 * Save or Update a Shaykh in the Roster
 */
export async function upsertShaykhInRoster(
  shaykh: Partial<ShaykhHotlineItem> & { name: string; whatsappNumber: string }
): Promise<ShaykhHotlineItem[]> {
  const { roster } = await getIslamicHotlineData();

  let updatedRoster: ShaykhHotlineItem[];

  if (shaykh.id) {
    // Update existing
    updatedRoster = roster.map((s) => {
      if (s.id === shaykh.id) {
        return { ...s, ...shaykh };
      }
      return s;
    });
  } else {
    // Create new
    const newShaykh: ShaykhHotlineItem = {
      id: `shaykh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: shaykh.name,
      title: shaykh.title || 'ইফতা ও ইসলামিক গবেষক',
      specialization: shaykh.specialization || 'কুরআন ও হাদিস ভিত্তিক পরামর্শ',
      institution: shaykh.institution || 'জাতীয় কওমি নেসাব / ইসলামিক বিশ্ববিদ্যালয়',
      phone: shaykh.phone || '',
      whatsappNumber: shaykh.whatsappNumber.replace(/[^0-9]/g, ''),
      avatarUrl: shaykh.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
      dutySchedule: shaykh.dutySchedule || 'প্রতিদিন: সকাল ১০টা - দুপুর ১টা',
      isOnDuty: shaykh.isOnDuty ?? true,
      isLiveChatActive: shaykh.isLiveChatActive ?? true,
      status: shaykh.status || 'ONLINE',
      bio: shaykh.bio || '',
      priorityOrder: shaykh.priorityOrder || roster.length + 1,
      totalConsultations: shaykh.totalConsultations || 0,
    };
    updatedRoster = [newShaykh, ...roster];
  }

  await prisma.siteSetting.upsert({
    where: { key: ROSTER_KEY },
    update: { value: JSON.stringify(updatedRoster) },
    create: { key: ROSTER_KEY, value: JSON.stringify(updatedRoster) },
  });

  return updatedRoster;
}

/**
 * Delete a Shaykh from the Roster
 */
export async function deleteShaykhFromRoster(id: string): Promise<ShaykhHotlineItem[]> {
  const { roster } = await getIslamicHotlineData();
  const updated = roster.filter((s) => s.id !== id);

  await prisma.siteSetting.upsert({
    where: { key: ROSTER_KEY },
    update: { value: JSON.stringify(updated) },
    create: { key: ROSTER_KEY, value: JSON.stringify(updated) },
  });

  return updated;
}

/**
 * Toggle Shaykh On-Duty Assignment Status
 */
export async function toggleShaykhDutyStatus(id: string): Promise<ShaykhHotlineItem[]> {
  const { roster } = await getIslamicHotlineData();
  const updated = roster.map((s) => {
    if (s.id === id) {
      const nextStatus = !s.isOnDuty;
      return {
        ...s,
        isOnDuty: nextStatus,
        status: nextStatus ? ('ONLINE' as const) : ('OFFLINE' as const),
      };
    }
    return s;
  });

  await prisma.siteSetting.upsert({
    where: { key: ROSTER_KEY },
    update: { value: JSON.stringify(updated) },
    create: { key: ROSTER_KEY, value: JSON.stringify(updated) },
  });

  return updated;
}

/**
 * Public helper to get on-duty Shaykhs and WhatsApp consultation details
 */
export async function getPublicHotlineData() {
  const { config, roster } = await getIslamicHotlineData();

  if (!config.hotlineEnabled) {
    return {
      enabled: false,
      config,
      onDutyShaykhs: [],
      primaryShaykh: null,
    };
  }

  const onDutyShaykhs = roster.filter((s) => s.isOnDuty);
  const primaryShaykh = onDutyShaykhs[0] || roster[0] || null;

  return {
    enabled: true,
    config,
    onDutyShaykhs,
    primaryShaykh,
  };
}


/**
 * শুব্বান লাইব্রেরী — ইউনিফাইড ডিজাইন সিস্টেম টোকেন ও কনফিগারেশন
 * Unified Design System Tokens & Brand Utilities
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary Forest Green Palette
    brand: {
      primary: '#123D32',
      primaryDark: '#0C2A22',
      primaryLight: '#236B58',
      surface: '#F8F5ED',
      surfaceMuted: '#F0F1EC',
    },
    // Antique Gold Accent Palette
    accent: {
      gold: '#C49A45',
      goldHover: '#B38938',
      goldLight: '#DEBC75',
      goldDark: '#9E782E',
    },
    // Neutral Charcoal & Ivory
    neutral: {
      charcoal: '#222522',
      charcoalLight: '#3C403C',
      charcoalMuted: '#5F655F',
      ivory: '#F8F5ED',
      borderLight: '#E5E7EB',
      borderDark: '#1E352E',
    },
    // Status & Feedback Colors
    status: {
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
    },
    // Dark Theme Surfaces
    dark: {
      bg: '#0D1714',
      card: '#13231E',
      border: '#1E352E',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
    },
  },
  typography: {
    fontBengali: '"Bornomala", "Hind Siliguri", "Noto Sans Bengali", system-ui, sans-serif',
    fontSerif: '"Bornomala", "Galada", "Merriweather", serif',
  },
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.5rem',// 24px
    full: '9999px',
  },
  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    cardHover: '0 10px 15px -3px rgba(18, 61, 50, 0.08), 0 4px 6px -4px rgba(18, 61, 50, 0.05)',
    elevated: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory shadow-sm transition-all active:scale-[0.98]',
  secondary:
    'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 transition-all',
  accent:
    'bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold shadow-md transition-all active:scale-[0.98]',
  outline:
    'border border-shubban-green/30 dark:border-shubban-gold/30 text-shubban-green dark:text-shubban-gold hover:bg-shubban-green/5 dark:hover:bg-shubban-gold/10 transition-all',
  ghost:
    'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all active:scale-[0.98]',
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-semibold',
};

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral';

export const BADGE_STYLES: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  warning:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  error:
    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  info:
    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  gold:
    'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
  neutral:
    'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700',
};


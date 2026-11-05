/**
 * Shubban AI Autonomous Management System — Safety & Approval Engine
 * 
 * Enforces Mode A (Auto Execute), Mode B (Preview & Approve), and Mode C (Confirmation Required).
 * Blocks dangerous, destructive, or unauthorized security-sensitive actions.
 */

export type SafetyMode = 'MODE_A' | 'MODE_B' | 'MODE_C';

export interface SafetyCheckResult {
  allowed: boolean;
  mode: SafetyMode;
  reason?: string;
  isDestructive: boolean;
  requiresDualApproval: boolean;
}

// Strictly prohibited intents or patterns that the AI must never perform
const FORBIDDEN_INTENTS = [
  'DROP_DATABASE',
  'RESET_DATABASE',
  'TRUNCATE_TABLE',
  'ALTER_SCHEMA',
  'EXPORT_SECRETS',
  'VIEW_PASSWORDS',
  'ESCALATE_PRIVILEGES',
  'BYPASS_AUTH',
  'EXECUTE_RAW_SQL',
  'TRANSFER_FUNDS_AUTONOMOUSLY',
];

// Mode C: High-risk operations requiring explicit dual Admin confirmation
const MODE_C_INTENTS = [
  'DELETE_PRODUCT',
  'BULK_DELETE_BOOKS',
  'CANCEL_ORDER',
  'PROCESS_REFUND',
  'UPDATE_PAYMENT_CONFIG',
  'UPDATE_USER_ROLE',
  'REVOKE_SELLER_APPROVAL',
  'DELETE_DONATION_CAMPAIGN',
];

// Mode B: Medium-risk operations requiring visual Before/After Diff Preview & Approval
const MODE_B_INTENTS = [
  'REORDER_HOMEPAGE',
  'TOGGLE_HOMEPAGE_SECTION',
  'CUSTOMIZE_HOMEPAGE_SECTION',
  'CREATE_CUSTOM_SECTION',
  'CREATE_HERO_SLIDE',
  'UPDATE_HERO_SLIDE',
  'DELETE_HERO_SLIDE',
  'LAUNCH_CAMPAIGN',
  'CREATE_COUPON',
  'UPDATE_PRODUCT_PRICE',
  'BULK_UPDATE_PRODUCTS',
  'UPDATE_APPEARANCE',
  'PUBLISH_PAGE',
  'UPDATE_NAVIGATION_MENU',
];

// Mode A: Low-risk operations (Read-only, analysis, drafting, SEO suggestions, scans)
const MODE_A_INTENTS = [
  'ANALYZE_INVENTORY',
  'LOW_STOCK_AUDIT',
  'GENERATE_PRODUCT_DESCRIPTION',
  'AUDIT_SEO',
  'DETECT_DUPLICATE_PRODUCTS',
  'DETECT_BROKEN_LINKS',
  'SALES_TREND_REPORT',
  'GENERAL_INQUIRY',
  'EXPLAIN_FEATURE',
  'DRAFT_CONTENT',
];

export function evaluateSafetyAndMode(
  intent: string,
  inputParams: Record<string, any> = {},
  rawCommand: string = ''
): SafetyCheckResult {
  const upperIntent = intent.toUpperCase();
  const upperCommand = rawCommand.toUpperCase();

  // 1. Check for strictly forbidden actions
  for (const forbidden of FORBIDDEN_INTENTS) {
    if (upperIntent.includes(forbidden) || upperCommand.includes(forbidden)) {
      return {
        allowed: false,
        mode: 'MODE_C',
        reason: 'নিরাপত্তা নীতি অনুযায়ী ডাটাবেস পরিবর্তন, সিক্রেট কী প্রদর্শন বা পারমিশন পরিবর্তনের মতো ঝুঁকিপূর্ণ কাজ স্বয়ংক্রিয়ভাবে নিষিদ্ধ।',
        isDestructive: true,
        requiresDualApproval: true,
      };
    }
  }

  // 2. Detect Mode C (High Risk)
  if (MODE_C_INTENTS.includes(upperIntent) || inputParams.isDestructive) {
    return {
      allowed: true,
      mode: 'MODE_C',
      reason: 'এই কাজটি উচ্চ ঝুঁকিপূর্ণ (অর্থ, রিফান্ড বা স্থায়ীভাবে ডেটা মোছার সাথে সম্পর্কিত)। চূড়ান্ত অনুমোদনের জন্য অ্যাডমিনের স্পষ্ট সম্মতি বাধ্যতামূলক।',
      isDestructive: true,
      requiresDualApproval: true,
    };
  }

  // 3. Detect Mode B (Medium Risk — Preview & Approve)
  if (MODE_B_INTENTS.includes(upperIntent)) {
    return {
      allowed: true,
      mode: 'MODE_B',
      reason: 'এই কাজটি ওয়েবসাইটের নকশা, ব্যানার বা কন্টেন্ট পরিবর্তন করবে। পরিবর্তনের পূর্বে প্রিভিউ কার্ডে অনুমোদন আবশ্যক।',
      isDestructive: false,
      requiresDualApproval: false,
    };
  }

  // 4. Default to Mode A (Low Risk — Auto Execute)
  return {
    allowed: true,
    mode: 'MODE_A',
    isDestructive: false,
    requiresDualApproval: false,
  };
}

/**
 * Sanitizes natural language prompt to prevent prompt injection or malicious command spoofing
 */
export function sanitizeUserCommand(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
    .slice(0, 4000);
}


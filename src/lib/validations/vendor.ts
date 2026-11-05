import { z } from 'zod';

export const vendorApplicationSchema = z.object({
  shopName: z.string().min(2, 'দোকানের নাম কমপক্ষে ২ অক্ষরের হতে হবে।'),
  ownerName: z.string().min(2, 'মালিকের নাম আবশ্যক।'),
  phone: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন।'),
  email: z.string().email('সঠিক ইমেইল ঠিকানা দিন।'),
  businessAddress: z.string().min(5, 'ব্যবসার ঠিকানা আবশ্যক।'),
  city: z.string().min(2, 'শহরের নাম দিন।'),
  businessType: z.enum(['BOOKSTORE', 'PUBLISHER', 'ISLAMIC_LIFESTYLE', 'GENERAL']).default('BOOKSTORE'),
  tradeLicense: z.string().optional().nullable(),
  nidNumber: z.string().optional().nullable(),
  description: z.string().max(1000, 'বিবরণ সর্বোচ্চ ১০০০ অক্ষরের হতে পারবে।').optional().nullable(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().positive('উত্তোলনের পরিমাণ ০-এর বেশি হতে হবে।'),
  method: z.enum(['BANK_TRANSFER', 'BKASH_MERCHANT', 'NAGAD']),
  accountDetails: z.string().min(5, 'অ্যাকাউন্ট বা মোবাইল ব্যাংকিং নম্বর দিন।'),
  notes: z.string().optional(),
});

export type VendorApplicationInput = z.infer<typeof vendorApplicationSchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;


import { z } from 'zod';

export const donationSchema = z.object({
  campaignId: z.string().min(1, 'ক্যাম্পেইন নির্বাচন করুন।'),
  donorName: z.string().min(2, 'দাতার নাম দিন।'),
  donorEmail: z.string().email('সঠিক ইমেইল দিন।').optional().or(z.literal('')),
  donorPhone: z.string().optional().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  amount: z.number().positive('অনুদানের পরিমাণ অবশ্যই ধনাত্মক হতে হবে।'),
  paymentMethod: z.enum(['bkash', 'nagad', 'sslcommerz', 'bank']).default('bkash'),
  transactionId: z.string().optional(),
  notes: z.string().max(300, 'মন্তব্য সর্বোচ্চ ৩০০ অক্ষরের হতে পারে।').optional(),
});

export type DonationInput = z.infer<typeof donationSchema>;


import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা প্রদান করুন।'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'আপনার পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।'),
  email: z.string().email('অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন।'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'),
  phone: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন।').optional().or(z.literal('')),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।').optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, 'জীবনবৃত্তান্ত সর্বোচ্চ ৫০০ অক্ষরের হতে হবে।').optional(),
  avatarUrl: z.string().url('সঠিক ছবি ইউআরএল দিন।').optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;


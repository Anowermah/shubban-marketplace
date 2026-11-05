import { z } from 'zod';

export const cartItemSchema = z.object({
  id: z.string().min(1, 'পণ্যের আইডি আবশ্যক।'),
  title: z.string().min(1, 'পণ্যের নাম আবশ্যক।'),
  slug: z.string().optional(),
  coverImage: z.string().optional(),
  price: z.number().nonnegative('মূল্য শূন্য বা ধনাত্মক হতে হবে।'),
  type: z.enum(['PHYSICAL', 'DIGITAL']).default('PHYSICAL'),
  quantity: z.number().int().positive('পরিমাণ কমপক্ষে ১ হতে হবে।').default(1),
  vendorId: z.string().optional().nullable(),
});

export const checkoutSchema = z.object({
  shippingName: z.string().min(2, 'প্রাপকের নাম প্রদান করুন।'),
  shippingPhone: z.string().min(11, '১১ ডিজিটের মোবাইল নম্বর দিন।'),
  shippingAddress: z.string().min(5, 'পূর্ণাঙ্গ ডেলিভারি ঠিকানা প্রদান করুন।'),
  shippingCity: z.string().min(2, 'শহরের নাম দিন।').default('ঢাকা'),
  customerEmail: z.string().email('সঠিক ইমেইল দিন।').optional().or(z.literal('')),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'sslcommerz', 'bank']).default('cod'),
  transactionId: z.string().optional(),
  isGiftWrapped: z.boolean().default(false),
  giftMessage: z.string().max(250, 'শুভেচ্ছা বার্তা সর্বোচ্চ ২৫০ অক্ষরের হতে পারে।').optional(),
  giftWrapFee: z.number().nonnegative().default(0),
  items: z.array(cartItemSchema).min(1, 'কার্টে কমপক্ষে একটি পণ্য থাকতে হবে।'),
  subtotal: z.number().optional(),
  shippingFee: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
});

export const shipmentUpdateSchema = z.object({
  courierName: z.string().min(2, 'কুরিয়ার সার্ভিসের নাম প্রদান করুন।'),
  trackingNumber: z.string().min(3, 'ট্র্যাকিং নম্বর প্রদান করুন।'),
  status: z.enum(['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('SHIPPED'),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ShipmentUpdateInput = z.infer<typeof shipmentUpdateSchema>;


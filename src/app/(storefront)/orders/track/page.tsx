import React from 'react';
import OrderTrackingClient from '@/components/shipping/OrderTrackingClient';

export const metadata = {
  title: 'অর্ডার ও কুরিয়ার ট্র্যাকিং | শুব্বান লাইব্রেরী',
  description: 'আপনার অর্ডার ও কুরিয়ার পার্সেল লাইভ ট্র্যাক করুন।',
};

export default function OrdersTrackPage() {
  return <OrderTrackingClient />;
}

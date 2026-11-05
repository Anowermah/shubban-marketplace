import React from 'react';
import OrderTrackingClient from '@/components/shipping/OrderTrackingClient';

export const metadata = {
  title: 'অর্ডার ট্র্যাকিং | শুব্বান লাইব্রেরী — বই, জ্ঞান ও মননশীলতা',
  description: 'আপনার অর্ডারের ডেলিভারি অবস্থা এবং কুরিয়ার পার্সেল ট্র্যাকিং রিয়েল-টাইম দেখুন।',
};

export default function TrackOrderPage() {
  return <OrderTrackingClient />;
}


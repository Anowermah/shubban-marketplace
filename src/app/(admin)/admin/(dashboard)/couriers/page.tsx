import React from 'react';
import AdminCourierDashboardClient from '@/components/admin/AdminCourierDashboardClient';

export const metadata = {
  title: 'কুরিয়ার ও ডেলিভারি ম্যানেজমেন্ট | শুব্বান লাইব্রেরী অ্যাডমিন',
  description: 'Steadfast, Pathao ও REDX কুরিয়ার অটোমেশন, পার্সেল বুকিং, লাইভ ট্র্যাকিং এবং সিওডি সেটেলমেন্ট।',
};

export default function AdminCouriersPage() {
  return <AdminCourierDashboardClient />;
}


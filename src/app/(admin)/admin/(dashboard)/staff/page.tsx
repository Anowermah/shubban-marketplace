import React from 'react';
import StaffDashboardClient from '@/components/admin/staff/StaffDashboardClient';

export const metadata = {
  title: 'প্রশাসনিক স্টাফ ও দায়িত্ব বণ্টন | Shubban Libery',
  description: 'অ্যাডমিনিস্ট্রেটিভ স্টাফ ড্যাশবোর্ড, দায়িত্ব বণ্টন ও এইচআরএম কমান্ড সেন্টার',
};

export const revalidate = 0;

export default function AdminStaffDashboardPage() {
  return <StaffDashboardClient />;
}

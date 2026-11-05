import React from 'react';
import StaffApprovalsClient from '@/components/admin/staff/StaffApprovalsClient';

export const metadata = {
  title: 'প্রশাসনিক অনুমোদন কিউ | Shubban Libery',
  description: 'কনটেন্ট প্রকাশনা, ছুটি, ব্যয় ও বিভিন্ন প্রশাসনিক অনুমোদন কিউ',
};

export const revalidate = 0;

export default function AdminStaffApprovalsPage() {
  return <StaffApprovalsClient />;
}


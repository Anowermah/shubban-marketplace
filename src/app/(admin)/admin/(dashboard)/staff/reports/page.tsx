import React from 'react';
import StaffReportsClient from '@/components/admin/staff/StaffReportsClient';

export const metadata = {
  title: 'স্টাফ পারফরম্যান্স ও ডিপার্টমেন্ট রিপোর্ট | Shubban Libery',
  description: 'প্রশাসনিক কর্মকর্তাদের কর্মদক্ষতা ও বিভাগভিত্তিক কার্য সম্পাদন রিপোর্ট',
};

export const revalidate = 0;

export default function AdminStaffReportsPage() {
  return <StaffReportsClient />;
}


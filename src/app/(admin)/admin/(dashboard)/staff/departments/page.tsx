import React from 'react';
import StaffDepartmentsClient from '@/components/admin/staff/StaffDepartmentsClient';

export const metadata = {
  title: 'ডিপার্টমেন্ট ও পদবি কাঠামো | Shubban Libery',
  description: 'প্রশাসনিক বিভাগ, শাখা ও পদমর্যাদা পদবি ব্যবস্থাপনা',
};

export const revalidate = 0;

export default function AdminStaffDepartmentsPage() {
  return <StaffDepartmentsClient />;
}


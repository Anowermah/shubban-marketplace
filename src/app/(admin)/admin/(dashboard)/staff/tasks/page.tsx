import React from 'react';
import StaffTasksClient from '@/components/admin/staff/StaffTasksClient';

export const metadata = {
  title: 'দায়িত্ব ও টাস্ক বণ্টন | Shubban Libery',
  description: 'প্রশাসনিক কর্মকর্তাদের দায়িত্ব বণ্টন ও কার্য অগ্রগতি পর্যবেক্ষণ',
};

export const revalidate = 0;

export default function AdminStaffTasksPage() {
  return <StaffTasksClient />;
}


import React from 'react';
import StaffDirectoryClient from '@/components/admin/staff/StaffDirectoryClient';

export const metadata = {
  title: 'স্টাফ ডিরেক্টরি ও প্রোফাইল | Shubban Libery',
  description: 'প্রশাসনিক কর্মকর্তাদের প্রোফাইল, পদবি ও যোগাযোগ ডিরেক্টরি',
};

export const revalidate = 0;

export default function AdminStaffDirectoryPage() {
  return <StaffDirectoryClient />;
}


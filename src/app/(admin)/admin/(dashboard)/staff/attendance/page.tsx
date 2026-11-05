import React from 'react';
import StaffAttendanceClient from '@/components/admin/staff/StaffAttendanceClient';

export const metadata = {
  title: 'উপস্থিতি ও ছুটির খাতা | Shubban Libery',
  description: 'প্রশাসনিক কর্মকর্তা ও কর্মীদের হাজিরা ও ছুটির ব্যবস্থাপনা',
};

export const revalidate = 0;

export default function AdminStaffAttendancePage() {
  return <StaffAttendanceClient />;
}


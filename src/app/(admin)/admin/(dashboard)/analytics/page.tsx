import React from 'react';
import AdminReportsPage from '../reports/page';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default function AdminAnalyticsPage() {
  return <AdminReportsPage />;
}


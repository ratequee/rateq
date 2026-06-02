'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardShell');

  return (
    <DashboardShell role="admin">
      <DashboardOverview title={t('adminTitle')} />
    </DashboardShell>
  );
}

'use client';

import { AdminOverview } from '@/components/dashboard/admin-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardShell');
  useRequireFirebaseAdmin();

  return (
    <DashboardShell role="admin">
      <AdminOverview title={t('adminTitle')} />
    </DashboardShell>
  );
}

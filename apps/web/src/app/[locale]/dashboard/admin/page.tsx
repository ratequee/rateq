'use client';

import { AdminOverview } from '@/components/dashboard/admin-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardShell');
  useRequireAdmin(AdminPermission.STATS);

  return (
    <DashboardShell role="admin">
      <AdminOverview title={t('adminTitle')} />
    </DashboardShell>
  );
}

'use client';

import { AdminProjectsPanel } from '@/components/dashboard/admin-projects-panel';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminProjectsPage() {
  const t = useTranslations('adminProjects');
  useRequireAdmin(AdminPermission.MODERATION);

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} />
      <AdminProjectsPanel />
    </DashboardShell>
  );
}

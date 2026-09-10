'use client';

import { AdminDirectoryPanel } from '@/components/dashboard/admin-directory-panel';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminDirectoryPage() {
  useRequireAdmin(AdminPermission.DIRECTORY);
  const t = useTranslations('adminDirectory');

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} />
      <AdminDirectoryPanel />
    </DashboardShell>
  );
}

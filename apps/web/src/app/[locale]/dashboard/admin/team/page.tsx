'use client';

import { AdminActivityPanel } from '@/components/dashboard/admin-activity-panel';
import { AdminTeamPanel } from '@/components/dashboard/admin-team-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminTeamPage() {
  const t = useTranslations('adminTeam');
  useRequireAdmin(AdminPermission.TEAM);

  return (
    <DashboardShell role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-secondary">{t('subtitle')}</p>
      </div>
      <AdminTeamPanel />
      <div className="mt-8">
        <AdminActivityPanel />
      </div>
    </DashboardShell>
  );
}

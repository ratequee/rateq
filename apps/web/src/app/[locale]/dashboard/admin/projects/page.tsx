'use client';

import { AdminProjectsPanel } from '@/components/dashboard/admin-projects-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { useTranslations } from 'next-intl';

export default function AdminProjectsPage() {
  const t = useTranslations('adminProjects');
  useRequireFirebaseAdmin();

  return (
    <DashboardShell role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>
      </div>
      <AdminProjectsPanel />
    </DashboardShell>
  );
}

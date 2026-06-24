'use client';

import { AdminCompanyCatalogPanel } from '@/components/dashboard/admin-company-catalog-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { useTranslations } from 'next-intl';

export default function AdminCompanyCatalogPage() {
  const t = useTranslations('adminCatalog');
  useRequireFirebaseAdmin();

  return (
    <DashboardShell role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-secondary">{t('pageSubtitle')}</p>
      </div>
      <AdminCompanyCatalogPanel />
    </DashboardShell>
  );
}

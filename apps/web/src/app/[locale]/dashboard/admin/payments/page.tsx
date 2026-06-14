'use client';

import { AdminPaymentsPanel } from '@/components/dashboard/admin-payments-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { useTranslations } from 'next-intl';

export default function AdminPaymentsPage() {
  const t = useTranslations('adminPayments');
  useRequireFirebaseAdmin();

  return (
    <DashboardShell role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>
      </div>
      <AdminPaymentsPanel />
    </DashboardShell>
  );
}

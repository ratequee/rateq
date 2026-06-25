'use client';

import { AdminPaymentsPanel } from '@/components/dashboard/admin-payments-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminPaymentsPage() {
  const t = useTranslations('adminPayments');
  useRequireAdmin(AdminPermission.STATS);

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

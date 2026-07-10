'use client';

import { AdminCompanyForm } from '@/components/dashboard/admin-company-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminCreateCompanyPage() {
  const t = useTranslations('adminCompanyForm');
  useRequireAdmin(AdminPermission.COMPANIES);

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={t('createTitle')} subtitle={t('createSubtitle')} />
      <AdminCompanyForm mode="create" />
    </DashboardShell>
  );
}

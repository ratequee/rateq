'use client';

import { CompanyProjectsForm } from '@/components/dashboard/company-projects-form';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { useTranslations } from 'next-intl';

export default function CompanyProjectsPage() {
  const t = useTranslations('profilePage');
  useRequireCompleteProfile();

  return (
    <DashboardShell role="company">
      <div className="mx-auto max-w-4xl">
        <DashboardPageHeader title={t('projectsPageTitle')} subtitle={t('projectsPageSubtitle')} />
        <CompanyProjectsForm />
      </div>
    </DashboardShell>
  );
}

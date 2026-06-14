'use client';

import { CompanyProjectsForm } from '@/components/dashboard/company-projects-form';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { useTranslations } from 'next-intl';

export default function CompanyProjectsPage() {
  const t = useTranslations('profilePage');
  useRequireCompleteProfile();

  return (
    <DashboardShell role="company">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{t('projectsPageTitle')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('projectsPageSubtitle')}</p>
        </div>
        <CompanyProjectsForm />
      </div>
    </DashboardShell>
  );
}

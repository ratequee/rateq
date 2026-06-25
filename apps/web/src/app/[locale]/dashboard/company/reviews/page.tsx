'use client';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardProfileLoading } from '@/components/dashboard/dashboard-profile-loading';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ReviewsManagementPanel } from '@/components/dashboard/reviews-management-panel';
import { useProfile } from '@/components/providers/profile-provider';
import { useTranslations } from 'next-intl';

export default function CompanyReviewsPage() {
  const t = useTranslations('dashboardReviews');
  const { onboarding, isLoading: profileLoading } = useProfile();
  const companyId = onboarding?.company?.id;

  return (
    <DashboardShell role="company">
      <DashboardPageHeader title={t('companyTitle')} subtitle={t('companySubtitle')} />
      {profileLoading ? (
        <DashboardProfileLoading />
      ) : companyId ? (
        <ReviewsManagementPanel mode="company" companyId={companyId} />
      ) : (
        <p className="text-sm text-secondary dark:text-slate-300">{t('companyMissing')}</p>
      )}
    </DashboardShell>
  );
}

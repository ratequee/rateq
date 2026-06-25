'use client';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ReviewsManagementPanel } from '@/components/dashboard/reviews-management-panel';
import { useTranslations } from 'next-intl';

export default function ReviewerReviewsPage() {
  const t = useTranslations('dashboardReviews');

  return (
    <DashboardShell role="reviewer">
      <DashboardPageHeader title={t('reviewerTitle')} subtitle={t('reviewerSubtitle')} />
      <ReviewsManagementPanel mode="reviewer" />
    </DashboardShell>
  );
}

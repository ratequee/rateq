'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ReviewsManagementPanel } from '@/components/dashboard/reviews-management-panel';
import { useTranslations } from 'next-intl';

export default function ReviewerReviewsPage() {
  const t = useTranslations('dashboardReviews');

  return (
    <DashboardShell role="reviewer">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('reviewerTitle')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('reviewerSubtitle')}</p>
      </div>
      <ReviewsManagementPanel mode="reviewer" />
    </DashboardShell>
  );
}

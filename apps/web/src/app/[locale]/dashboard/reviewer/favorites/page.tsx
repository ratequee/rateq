'use client';

import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ReviewerFavoriteCompaniesList } from '@/components/dashboard/reviewer-favorite-companies-list';
import { useTranslations } from 'next-intl';

export default function ReviewerFavoritesPage() {
  const t = useTranslations('reviewerFavorites');

  return (
    <DashboardShell role="reviewer">
      <DashboardPageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />
      <ReviewerFavoriteCompaniesList />
    </DashboardShell>
  );
}

'use client';

import { ReviewsManagementPanel } from '@/components/dashboard/reviews-management-panel';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminReviewsPage() {
  const t = useTranslations('dashboardReviews');
  useRequireAdmin(AdminPermission.MODERATION);

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={t('adminTitle')} subtitle={t('adminSubtitle')} />
      <ReviewsManagementPanel mode="admin" />
    </DashboardShell>
  );
}

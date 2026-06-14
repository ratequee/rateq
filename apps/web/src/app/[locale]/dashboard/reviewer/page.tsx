'use client';

import { ReviewerOverview } from '@/components/dashboard/reviewer-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { reviewsApi } from '@/lib/api';
import type { ReviewerDashboard } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function ReviewerDashboardPage() {
  const t = useTranslations('dashboardShell');
  const { user } = useAuth();
  const { onboarding } = useProfile();
  useRequireCompleteProfile();

  const [dashboard, setDashboard] = useState<ReviewerDashboard | null>(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('rateq_access_token');
    if (!token) return;

    reviewsApi
      .getDashboard(token)
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [user]);

  const displayName = onboarding?.reviewerProfile?.fullName ?? t('reviewerFallback');

  return (
    <DashboardShell role="reviewer">
      <ReviewerOverview title={t('reviewerTitle', { name: displayName })} dashboard={dashboard} />
    </DashboardShell>
  );
}

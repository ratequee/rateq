'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { getAccessToken } from '@/lib/auth-storage';
import { reviewsApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function ReviewerDashboardPage() {
  const t = useTranslations('dashboardShell');
  const { user } = useAuth();
  const { onboarding } = useProfile();
  useRequireCompleteProfile();

  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) return;

    reviewsApi
      .listMine(token)
      .then((res) => setReviewCount(res.meta.total))
      .catch(() => setReviewCount(0));
  }, [user]);

  const displayName = onboarding?.reviewerProfile?.fullName ?? t('reviewerFallback');

  return (
    <DashboardShell role="reviewer">
      <DashboardOverview
        title={t('reviewerTitle', { name: displayName })}
        reviewCount={reviewCount}
      />
    </DashboardShell>
  );
}

'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getStoredProfile } from '@/lib/profile-storage';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslations } from 'next-intl';

export default function ReviewerDashboardPage() {
  const t = useTranslations('dashboardShell');
  const { user } = useAuth();
  const profile = user ? getStoredProfile() : null;

  return (
    <DashboardShell role="reviewer">
      <DashboardOverview
        title={t('reviewerTitle', {
          name: profile?.reviewer?.fullName ?? t('reviewerFallback'),
        })}
      />
    </DashboardShell>
  );
}

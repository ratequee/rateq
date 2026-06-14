'use client';

import { CompanyOverview } from '@/components/dashboard/company-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import {
  useRequireCompleteProfile,
  useRequireVerifiedAuth,
} from '@/hooks/use-require-verified-auth';
import { isCompanyPendingApproval, isCompanyRevisionRequested } from '@/lib/profile-routing';
import { companiesApi } from '@/lib/api';
import type { CompanyDashboard } from '@rateq/types';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function CompanyDashboardPage() {
  const t = useTranslations('dashboardShell');
  const tp = useTranslations('profilePage');
  const { user } = useAuth();
  const { onboarding, isLoading: profileLoading } = useProfile();
  const router = useRouter();
  useRequireVerifiedAuth();
  useRequireCompleteProfile();

  useEffect(() => {
    if (profileLoading || !user) return;
    if (isCompanyPendingApproval(onboarding) || isCompanyRevisionRequested(onboarding)) {
      router.replace('/complete-profile');
    }
  }, [onboarding, profileLoading, router, user]);

  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('rateq_access_token');
    if (!token) return;

    companiesApi
      .getDashboard(token)
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [user]);

  const status =
    onboarding?.company?.verificationStatus ?? (onboarding?.company ? 'pending' : undefined);

  const companyName = dashboard?.company.name ?? onboarding?.company?.name ?? t('companyFallback');

  return (
    <DashboardShell role="company">
      {status === 'pending' && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {tp('companyPendingBanner')}
        </div>
      )}

      <CompanyOverview title={t('companyTitle', { name: companyName })} dashboard={dashboard} />
    </DashboardShell>
  );
}

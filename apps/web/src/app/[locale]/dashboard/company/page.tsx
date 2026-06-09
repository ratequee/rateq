'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/components/providers/profile-provider';
import {
  useRequireCompleteProfile,
  useRequireVerifiedAuth,
} from '@/hooks/use-require-verified-auth';
import { isCompanyPendingApproval, isCompanyRejected } from '@/lib/profile-routing';
import { Link } from '@/i18n/routing';
import { companiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
    if (isCompanyPendingApproval(onboarding) || isCompanyRejected(onboarding)) {
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

      {status === 'rejected' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <span>{tp('companyRejectedBanner')}</span>
          <Link href="/complete-profile">
            <Button variant="outline-brand" size="sm">
              {tp('editProfile')}
            </Button>
          </Link>
        </div>
      )}

      <DashboardOverview
        title={t('companyTitle', { name: companyName })}
        companyStats={dashboard?.stats}
      />
    </DashboardShell>
  );
}

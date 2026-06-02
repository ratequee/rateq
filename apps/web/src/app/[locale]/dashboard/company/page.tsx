'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { getStoredProfile } from '@/lib/profile-storage';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function CompanyDashboardPage() {
  const t = useTranslations('dashboardShell');
  const tp = useTranslations('profilePage');
  const { user } = useAuth();
  const profile = user ? getStoredProfile() : null;
  const status = profile?.companyVerificationStatus;

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
        title={t('companyTitle', {
          name: profile?.company?.name ?? t('companyFallback'),
        })}
      />
    </DashboardShell>
  );
}

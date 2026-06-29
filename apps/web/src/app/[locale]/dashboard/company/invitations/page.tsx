'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { CompanyReviewerInvitationRequestsPanel } from '@/components/dashboard/company-reviewer-invitation-requests-panel';
import { useRequireCompleteProfile } from '@/hooks/use-require-verified-auth';
import { useTranslations } from 'next-intl';

export default function CompanyInvitationsPage() {
  const t = useTranslations('reviewerInvitations');
  useRequireCompleteProfile();

  return (
    <DashboardShell role="company">
      <div className="mx-auto max-w-2xl">
        <DashboardPageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />
        <CompanyReviewerInvitationRequestsPanel />
      </div>
    </DashboardShell>
  );
}

'use client';

import { AdminReviewerInvitationRequestsPanel } from '@/components/dashboard/admin-reviewer-invitation-requests-panel';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useTranslations } from 'next-intl';

export default function AdminReviewerInvitationsPage() {
  const t = useTranslations('dashboardShell.nav');
  useRequireAdmin(AdminPermission.INVITATIONS);

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader
        title={t('reviewerInvitations')}
        subtitle="Review and manage reviewer invitation requests."
      />
      <AdminReviewerInvitationRequestsPanel />
    </DashboardShell>
  );
}

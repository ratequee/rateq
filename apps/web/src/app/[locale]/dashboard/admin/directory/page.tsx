'use client';

import { AdminDirectoryPanel } from '@/components/dashboard/admin-directory-panel';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';

const PAGE_TITLE = 'Platform directory';
const PAGE_SUBTITLE = 'Manage reviewers, companies, reviews, and replies.';

export default function AdminDirectoryPage() {
  useRequireAdmin(AdminPermission.DIRECTORY);

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />
      <AdminDirectoryPanel />
    </DashboardShell>
  );
}

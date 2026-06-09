'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { Link } from '@/i18n/routing';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboardShell');
  const ta = useTranslations('adminCompanies');

  useRequireFirebaseAdmin();

  return (
    <DashboardShell role="admin">
      <div className="mb-6">
        <div className="mb-4 flex flex-wrap justify-end">
          <Link href="/dashboard/admin/companies">
            <Button className="gap-2">
              <Building2 className="h-4 w-4" />
              {ta('openVerifications')}
            </Button>
          </Link>
        </div>
        <DashboardOverview title={t('adminTitle')} />
      </div>
    </DashboardShell>
  );
}

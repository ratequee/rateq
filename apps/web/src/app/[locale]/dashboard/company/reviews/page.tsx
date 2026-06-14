'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ReviewsManagementPanel } from '@/components/dashboard/reviews-management-panel';
import { companiesApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function CompanyReviewsPage() {
  const t = useTranslations('dashboardReviews');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const token = await ensureValidAccessToken();
        if (!token) return;
        const dashboard = await companiesApi.getDashboard(token);
        if (!cancelled) setCompanyId(dashboard.company.id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell role="company">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('companyTitle')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('companySubtitle')}</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20 text-ink-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : companyId ? (
        <ReviewsManagementPanel mode="company" companyId={companyId} />
      ) : (
        <p className="text-sm text-ink-muted">{t('companyMissing')}</p>
      )}
    </DashboardShell>
  );
}

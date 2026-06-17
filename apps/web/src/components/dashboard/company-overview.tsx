'use client';

import { CompanyTopReviewersList } from '@/components/dashboard/company-top-reviewers-list';
import { DashboardActivityChart } from '@/components/dashboard/dashboard-activity-chart';
import { DashboardReviewsTable } from '@/components/dashboard/dashboard-reviews-table';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { mapReviewToDashboardRow } from '@/lib/dashboard-review-rows';
import type { CompanyDashboard } from '@rateq/types';
import { ClipboardList, Eye, ShoppingCart, Star, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface CompanyOverviewProps {
  title: string;
  dashboard: CompanyDashboard | null;
}

const statIcons = [ClipboardList, ShoppingCart, Users, Star, Eye] as const;

export function CompanyOverview({ title, dashboard }: CompanyOverviewProps) {
  const t = useTranslations('dashboardShell');
  const tc = useTranslations('companyOverview');
  const locale = useLocale();
  const stats = dashboard?.stats;

  const cards = stats
    ? [
        { key: 'totalReviews', value: String(stats.totalReviews), change: '', positive: true },
        { key: 'pendingReviews', value: String(stats.pendingReviews), change: '', positive: false },
        {
          key: 'approvedReviews',
          value: String(stats.approvedReviews),
          change: '',
          positive: true,
        },
        {
          key: 'rejectedReviews',
          value: String(stats.rejectedReviews),
          change: '',
          positive: false,
        },
        { key: 'averageRating', value: stats.averageRating.toFixed(1), change: '', positive: true },
        {
          key: 'monthlyPageVisits',
          value: String(stats.monthlyPageVisits),
          change: '',
          positive: true,
        },
      ]
    : [
        { key: 'totalReviews', value: '—', change: '', positive: true },
        { key: 'pendingReviews', value: '—', change: '', positive: false },
        { key: 'approvedReviews', value: '—', change: '', positive: true },
        { key: 'rejectedReviews', value: '—', change: '', positive: false },
        { key: 'averageRating', value: '—', change: '', positive: true },
        { key: 'monthlyPageVisits', value: '—', change: '', positive: true },
      ];

  const chartData = useMemo(() => {
    const activity =
      dashboard?.dailyActivity ??
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return {
          date: date.toISOString().slice(0, 10),
          reviewCount: 0,
          pageVisits: 0,
        };
      });

    return activity.map((point) => {
      const date = new Date(`${point.date}T00:00:00`);

      return {
        companies: point.pageVisits,
        reviewers: point.reviewCount,
        label: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        fullLabel: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      };
    });
  }, [dashboard?.dailyActivity, locale]);

  const latestReviewRows = (dashboard?.latestReviews ?? []).map(mapReviewToDashboardRow);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('overviewSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((stat, index) => (
          <DashboardStatCard
            key={stat.key}
            label={t(`stats.${stat.key}`)}
            value={stat.value}
            change={stat.change}
            positive={stat.positive}
            icon={statIcons[index] ?? Star}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">{tc('activityTitle')}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">{tc('last7Days')}</p>
            </div>
          </div>
          <DashboardActivityChart
            data={chartData}
            companiesLabel={tc('chartLegendPageVisits')}
            reviewersLabel={tc('chartLegendReviews')}
            emptyLabel={tc('activityEmpty')}
            valueAxis="count"
          />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <CompanyTopReviewersList reviewers={dashboard?.topReviewers ?? []} />
        </div>
      </div>

      {latestReviewRows.length ? (
        <DashboardReviewsTable rows={latestReviewRows} showActions={false} />
      ) : null}
    </div>
  );
}

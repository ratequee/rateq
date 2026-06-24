'use client';

import { AdminInviteCompanyPanel } from '@/components/dashboard/admin-invite-company-panel';
import { AdminProfileChangesPanel } from '@/components/dashboard/admin-profile-changes-panel';
import { AdminTopCompaniesList } from '@/components/dashboard/admin-top-companies-list';
import { AvatarImage } from '@/components/ui/avatar-image';
import { DashboardReviewsTable } from '@/components/dashboard/dashboard-reviews-table';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import {
  DashboardActivityChart,
  DashboardChartDailyFilter,
} from '@/components/dashboard/dashboard-activity-chart';
import { adminApi } from '@/lib/admin-platform-api';
import { mapReviewToDashboardRow } from '@/lib/dashboard-review-rows';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { AdminPlatformStats } from '@rateq/types';
import { Building2, ClipboardList, Star, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

interface AdminOverviewProps {
  title: string;
}

const statIcons = [Building2, Users, ClipboardList] as const;

export function AdminOverview({ title }: AdminOverviewProps) {
  const t = useTranslations('dashboardShell');
  const ta = useTranslations('adminOverview');
  const locale = useLocale();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);

  useEffect(() => {
    void (async () => {
      const token = await ensureValidAccessToken();
      if (!token) return;
      try {
        setStats(await adminApi.getStats(token));
      } catch {
        setStats(null);
      }
    })();
  }, []);

  const cards = stats
    ? [
        { key: 'totalCompanies', value: String(stats.totalCompanies), change: '', positive: true },
        { key: 'totalReviewers', value: String(stats.totalReviewers), change: '', positive: true },
        { key: 'totalReviews', value: String(stats.totalReviews), change: '', positive: true },
      ]
    : [
        { key: 'totalCompanies', value: '—', change: '', positive: true },
        { key: 'totalReviewers', value: '—', change: '', positive: true },
        { key: 'totalReviews', value: '—', change: '', positive: true },
      ];

  const latestReviewRows = (stats?.latestReviews ?? []).map(mapReviewToDashboardRow);

  const chartData = useMemo(() => {
    const activity =
      stats?.dailyActivity ??
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return {
          date: date.toISOString().slice(0, 10),
          reviewCount: 0,
          companiesCount: 0,
          reviewersCount: 0,
        };
      });

    return activity.map((point) => {
      const date = new Date(`${point.date}T00:00:00`);

      return {
        companies: point.companiesCount,
        reviewers: point.reviewersCount,
        label: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        fullLabel: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      };
    });
  }, [stats?.dailyActivity, locale]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-secondary">{t('overviewSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((stat, index) => (
          <DashboardStatCard
            key={stat.key}
            label={ta(`stats.${stat.key}`)}
            value={stat.value}
            change={stat.change}
            positive={stat.positive}
            icon={statIcons[index] ?? Star}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-primary">{t('latestRatingsChart')}</h3>
            <DashboardChartDailyFilter label={t('daily')} />
          </div>
          <DashboardActivityChart
            data={chartData}
            companiesLabel={ta('chartLegendCompanies')}
            reviewersLabel={ta('chartLegendReviewers')}
            emptyLabel={ta('chartEmpty')}
            valueAxis="count"
          />
        </div>

        <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
          <AdminTopCompaniesList companies={stats?.topCompanies ?? []} />
        </div>
      </div>

      {latestReviewRows.length ? (
        <DashboardReviewsTable rows={latestReviewRows} showActions={false} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-primary">{t('topReviewers')}</h3>
          <div className="space-y-4">
            {(stats?.topReviewers ?? []).map((reviewer) => (
              <div key={reviewer.id} className="flex items-center gap-3">
                <AvatarImage
                  src={reviewer.avatarUrl}
                  name={reviewer.name}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-primary">{reviewer.name}</p>
                  <p className="truncate text-xs text-secondary">{reviewer.email}</p>
                </div>
                <span className="ms-auto text-xs text-secondary">
                  {ta('reviewCountLabel', { count: reviewer.reviewCount })}
                </span>
              </div>
            ))}
            {!stats?.topReviewers.length ? (
              <p className="text-sm text-secondary">{ta('noData')}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-primary">{t('pendingReviews')}</h3>
          <div className="space-y-3 text-sm text-secondary">
            <p>{ta('pendingCount', { count: stats?.pendingReviews ?? 0 })}</p>
            <p>{ta('resolutionCount', { count: stats?.resolutionPendingReviews ?? 0 })}</p>
            <p>{ta('rejectedCount', { count: stats?.rejectedReviews ?? 0 })}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminInviteCompanyPanel />
        <AdminProfileChangesPanel />
      </div>
    </div>
  );
}

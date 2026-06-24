'use client';

import { DashboardReviewsTable } from '@/components/dashboard/dashboard-reviews-table';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { AvatarImage } from '@/components/ui/avatar-image';
import {
  chartBars,
  dashboardStats,
  latestReviews,
  topCompanies,
  topReviewers,
} from '@/lib/dashboard-mock-data';
import { ClipboardList, Database, ShoppingCart, Star, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

const statIcons = [ClipboardList, ShoppingCart, Users, Star, Database] as const;

import type { CompanyDashboardStats } from '@rateq/types';

interface DashboardOverviewProps {
  title: string;
  reviewCount?: number;
  companyStats?: CompanyDashboardStats;
}

export function DashboardOverview({
  title,
  reviewCount = 0,
  companyStats,
}: DashboardOverviewProps) {
  const t = useTranslations('dashboardShell');

  const stats = companyStats
    ? [
        {
          key: 'totalReviews',
          value: String(companyStats.totalReviews),
          change: '',
          positive: true,
        },
        {
          key: 'pendingReviews',
          value: String(companyStats.pendingReviews),
          change: '',
          positive: false,
        },
        {
          key: 'approvedReviews',
          value: String(companyStats.approvedReviews),
          change: '',
          positive: true,
        },
        {
          key: 'rejectedReviews',
          value: String(companyStats.rejectedReviews),
          change: '',
          positive: false,
        },
        {
          key: 'averageRating',
          value: companyStats.averageRating.toFixed(1),
          change: '',
          positive: true,
        },
      ]
    : dashboardStats.map((stat, index) =>
        index === 0 ? { ...stat, value: String(reviewCount) } : stat,
      );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-secondary">{t('overviewSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, index) => (
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
        <div className="surface-card p-5">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-primary">{t('latestRatingsChart')}</h3>
            <select className="select-field rounded-lg">
              <option>{t('daily')}</option>
            </select>
          </div>
          <div className="flex h-56 items-end gap-2">
            {chartBars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1">
                  <div className="w-3 rounded-t bg-brand-500" style={{ height: `${height}%` }} />
                  <div
                    className="w-3 rounded-t bg-gold-400"
                    style={{ height: `${Math.max(20, height - 15)}%` }}
                  />
                </div>
                <span className="text-[10px] text-secondary">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="mb-4 text-lg font-bold text-primary">{t('topCompanies')}</h3>
          <div className="space-y-4">
            {topCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-950/50" />
                  <div>
                    <p className="font-medium text-primary">{company.name}</p>
                    <p className="text-xs text-secondary">{company.count}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardReviewsTable rows={latestReviews} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface-card p-5">
          <h3 className="mb-4 text-lg font-bold text-primary">{t('topReviewers')}</h3>
          <div className="space-y-4">
            {topReviewers.map((reviewer, index) => (
              <div key={index} className="flex items-center gap-3">
                <AvatarImage src={null} name={reviewer.name} className="h-10 w-10 shrink-0" />
                <div>
                  <p className="font-medium text-primary">{reviewer.name}</p>
                  <p className="text-xs text-secondary">{reviewer.location}</p>
                </div>
                <span className="ms-auto text-xs text-secondary">{reviewer.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="mb-4 text-lg font-bold text-primary">{t('pendingReviews')}</h3>
          <div className="space-y-4 text-sm text-secondary">
            <p>{t('pendingSample1')}</p>
            <p>{t('pendingSample2')}</p>
            <p>{t('pendingSample3')}</p>
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="mb-4 text-lg font-bold text-primary">{t('notifications')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl surface-muted px-3 py-3">
              <span>{t('notificationItem')}</span>
              <button type="button" className="text-brand-500">
                {t('cancel')}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl surface-muted px-3 py-3">
              <span>{t('notificationItem')}</span>
              <button type="button" className="text-brand-500">
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

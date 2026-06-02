'use client';

import { DashboardReviewsTable } from '@/components/dashboard/dashboard-reviews-table';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { chartBars, dashboardStats, latestReviews, topCompanies, topReviewers } from '@/lib/dashboard-mock-data';
import { ClipboardList, Database, ShoppingCart, Star, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

const statIcons = [ClipboardList, ShoppingCart, Users, Star, Database] as const;

interface DashboardOverviewProps {
  title: string;
}

export function DashboardOverview({ title }: DashboardOverviewProps) {
  const t = useTranslations('dashboardShell');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('overviewSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboardStats.map((stat, index) => (
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
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-ink">{t('latestRatingsChart')}</h3>
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option>{t('daily')}</option>
            </select>
          </div>
          <div className="flex h-56 items-end gap-2">
            {chartBars.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1">
                  <div className="w-3 rounded-t bg-brand-500" style={{ height: `${height}%` }} />
                  <div className="w-3 rounded-t bg-gold-400" style={{ height: `${Math.max(20, height - 15)}%` }} />
                </div>
                <span className="text-[10px] text-ink-muted">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-ink">{t('topCompanies')}</h3>
          <div className="space-y-4">
            {topCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-100" />
                  <div>
                    <p className="font-medium text-ink">{company.name}</p>
                    <p className="text-xs text-ink-muted">{company.count}</p>
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
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-ink">{t('topReviewers')}</h3>
          <div className="space-y-4">
            {topReviewers.map((reviewer, index) => (
              <div key={index} className="flex items-center gap-3">
                <img src="/images/author.svg" alt="" className="h-10 w-10 rounded-full" />
                <div>
                  <p className="font-medium text-ink">{reviewer.name}</p>
                  <p className="text-xs text-ink-muted">{reviewer.location}</p>
                </div>
                <span className="ms-auto text-xs text-ink-muted">{reviewer.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-ink">{t('pendingReviews')}</h3>
          <div className="space-y-4 text-sm text-ink-muted">
            <p>{t('pendingSample1')}</p>
            <p>{t('pendingSample2')}</p>
            <p>{t('pendingSample3')}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-ink">{t('notifications')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
              <span>{t('notificationItem')}</span>
              <button type="button" className="text-brand-500">{t('cancel')}</button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
              <span>{t('notificationItem')}</span>
              <button type="button" className="text-brand-500">{t('cancel')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

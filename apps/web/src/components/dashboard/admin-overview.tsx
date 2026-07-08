'use client';

import { AdminInviteCompanyPanel } from '@/components/dashboard/admin-invite-company-panel';
import { Link } from '@/i18n/routing';
import { AdminTopCompaniesList } from '@/components/dashboard/admin-top-companies-list';
import { AvatarImage } from '@/components/ui/avatar-image';
import { DashboardReviewsTable } from '@/components/dashboard/dashboard-reviews-table';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import {
  DashboardActivityChart,
  DashboardChartDailyFilter,
} from '@/components/dashboard/dashboard-activity-chart';
import { adminApi } from '@/lib/admin-platform-api';
import { cn } from '@/lib/utils';
import { mapReviewToDashboardRow } from '@/lib/dashboard-review-rows';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { useAuth } from '@/components/providers/auth-provider';
import type { AdminPlatformStats } from '@rateq/types';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Flag,
  FolderKanban,
  MessageSquareText,
  PencilRuler,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

const PENDING_ACTION_ITEMS = [
  { key: 'companyApprovals', href: '/dashboard/admin/companies?filter=pending', icon: Building2 },
  {
    key: 'profileChanges',
    href: '/dashboard/admin/companies?filter=profile_changes',
    icon: PencilRuler,
  },
  { key: 'reviewModeration', href: '/dashboard/admin/reviews', icon: ClipboardList },
  { key: 'replyModeration', href: '/dashboard/admin/reviews', icon: MessageSquareText },
  { key: 'projectModeration', href: '/dashboard/admin/projects', icon: FolderKanban },
  { key: 'reviewReports', href: '/dashboard/admin/directory', icon: Flag },
  { key: 'reviewerInvitationRequests', href: '/dashboard/admin/directory', icon: UserPlus },
] as const;

interface AdminOverviewProps {
  title: string;
}

const statIcons = [Building2, Users, ClipboardList] as const;

export function AdminOverview({ title }: AdminOverviewProps) {
  const t = useTranslations('dashboardShell');
  const ta = useTranslations('adminOverview');
  const locale = useLocale();
  const { isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);

  useEffect(() => {
    if (authLoading) return;

    void (async () => {
      const token = await ensureValidAccessToken();
      if (!token) return;
      try {
        setStats(await adminApi.getStats(token));
      } catch {
        setStats(null);
      }
    })();
  }, [authLoading]);

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

      <PendingActionsPanel stats={stats} ta={ta} />

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
        <div className="rounded-2xl border border-subtle surface-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary dark:text-white">
            {t('nav.companyVerifications')}
          </h3>
          <p className="mt-1 text-sm text-secondary dark:text-slate-300">
            Review pending profile updates submitted by verified companies.
          </p>
          <Link
            href="/dashboard/admin/companies?filter=profile_changes"
            className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
          >
            View pending profile changes →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PendingActionsPanel({
  stats,
  ta,
}: {
  stats: AdminPlatformStats | null;
  ta: ReturnType<typeof useTranslations<'adminOverview'>>;
}) {
  const pending = stats?.pendingActions;
  const total = pending?.total ?? 0;

  return (
    <div className="rounded-2xl border border-subtle surface-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-primary">{ta('pendingActionsTitle')}</h3>
          <p className="mt-0.5 text-sm text-secondary">{ta('pendingActionsSubtitle')}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
            total > 0
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
          )}
        >
          {total === 0 ? <CheckCircle2 className="h-4 w-4" /> : null}
          {ta('pendingActionsTotal', { count: total })}
        </span>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-subtle px-4 py-6 text-center text-sm text-secondary">
          {ta('pendingActionsAllClear')}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PENDING_ACTION_ITEMS.filter((item) => (pending?.[item.key] ?? 0) > 0).map((item) => {
            const count = pending?.[item.key] ?? 0;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-subtle bg-slate-50/60 p-4 transition hover:border-brand-300 hover:bg-brand-50/60 dark:bg-dm-elevated/50 dark:hover:bg-dm-elevated"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold leading-none text-primary">{count}</p>
                  <p className="mt-1 truncate text-xs font-medium text-secondary">
                    {ta(`pendingActions.${item.key}`)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-brand-600 rtl:rotate-180" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

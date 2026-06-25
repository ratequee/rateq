'use client';

import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import { ADMIN_PROJECT_ROWS, ADMIN_PROJECT_STATS } from '@/lib/admin-static-data';
import { cn } from '@/lib/utils';
import { Building2, FolderKanban, Sparkles, Timer } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const statusStyles = {
  featured: 'bg-gold-50 text-gold-700',
  published: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
} as const;

export function AdminProjectsPanel() {
  const t = useTranslations('adminProjects');
  const locale = useLocale();

  const stats = [
    {
      key: 'totalProjects',
      value: String(ADMIN_PROJECT_STATS.totalProjects),
      change: t('statsChangeUp', { value: '+8%' }),
      positive: true,
      icon: FolderKanban,
    },
    {
      key: 'featuredProjects',
      value: String(ADMIN_PROJECT_STATS.featuredProjects),
      change: t('statsChangeUp', { value: '+2' }),
      positive: true,
      icon: Sparkles,
    },
    {
      key: 'pendingReview',
      value: String(ADMIN_PROJECT_STATS.pendingReview),
      change: t('statsNeedsAction'),
      positive: false,
      icon: Timer,
    },
    {
      key: 'companiesWithProjects',
      value: String(ADMIN_PROJECT_STATS.companiesWithProjects),
      change: t('statsChangeUp', { value: '+3' }),
      positive: true,
      icon: Building2,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.key}
            label={t(`stats.${stat.key}`)}
            value={stat.value}
            change={stat.change}
            positive={stat.positive}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl surface-card border shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-primary">{t('tableTitle')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('tableSubtitle')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-secondary">
              <tr>
                <th className="px-5 py-3 text-start font-medium">{t('table.project')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.company')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.category')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.status')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('table.submitted')}</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_PROJECT_ROWS.map((project) => (
                <tr key={project.id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.imageUrl}
                        alt=""
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                      <span className="font-medium text-primary">
                        {t(`rows.${project.id}.title`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-primary">{t(`rows.${project.id}.company`)}</td>
                  <td className="px-5 py-4 text-secondary">{t(`rows.${project.id}.category`)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                        statusStyles[project.status],
                      )}
                    >
                      {t(`status.${project.status}`)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary">
                    {new Date(`${project.submittedAt}T00:00:00`).toLocaleDateString(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

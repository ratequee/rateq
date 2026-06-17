'use client';

import { AvatarImage } from '@/components/ui/avatar-image';
import { StarRating } from '@/components/ui/star-rating';
import type { DashboardReviewRow } from '@/lib/dashboard-review-rows';
import { cn } from '@/lib/utils';
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardReviewsTableProps {
  rows: DashboardReviewRow[];
  showActions?: boolean;
}

const statusStyles: Record<DashboardReviewRow['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  useful: 'bg-slate-100 text-slate-600',
};

export function DashboardReviewsTable({ rows, showActions = true }: DashboardReviewsTableProps) {
  const t = useTranslations('dashboardShell');

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-bold text-ink">{t('latestReviews')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-ink-muted">
            <tr>
              <th className="px-5 py-3 text-start font-medium">{t('table.company')}</th>
              <th className="px-5 py-3 text-start font-medium">{t('table.user')}</th>
              <th className="px-5 py-3 text-start font-medium">{t('table.rating')}</th>
              <th className="px-5 py-3 text-start font-medium">{t('table.status')}</th>
              {showActions ? (
                <th className="px-5 py-3 text-start font-medium">{t('table.actions')}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <AvatarImage
                      src={row.companyLogoUrl}
                      name={row.company}
                      variant="rounded"
                      className="h-10 w-10 shrink-0"
                    />
                    <span className="font-medium text-ink">{row.company}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <AvatarImage
                      src={row.userAvatarUrl}
                      name={row.user}
                      className="h-9 w-9 shrink-0"
                    />
                    <div>
                      <p className="font-medium text-ink">{row.user}</p>
                      {row.location ? (
                        <p className="text-xs text-ink-muted">{row.location}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StarRating value={row.rating} size="sm" />
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                      statusStyles[row.status],
                    )}
                  >
                    {t(`status.${row.status}`)}
                  </span>
                </td>
                {showActions ? (
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-ink-muted">
                      <button type="button" className="rounded-lg p-2 hover:bg-slate-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-lg p-2 hover:bg-slate-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-lg p-2 hover:bg-slate-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

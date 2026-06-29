'use client';

import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { reviewsApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { ReviewReportPublic } from '@rateq/types';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

export function AdminReviewReportsPanel() {
  const t = useTranslations('adminReviewReports');
  const locale = useLocale();
  const [reports, setReports] = useState<ReviewReportPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;
      const response = await reviewsApi.listReviewReports(token, page, 20);
      setReports(response.data);
      setTotalPages(response.meta.totalPages);
    } catch {
      toast.error(t('loadError'));
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActingId(id);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;
      if (action === 'approve') {
        await reviewsApi.approveReviewReport(token, id);
        toast.success(t('approved'));
      } else {
        await reviewsApi.rejectReviewReport(token, id);
        toast.success(t('rejected'));
      }
      await load();
    } catch {
      toast.error(t('actionError'));
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (reports.length === 0) {
    return <p className="py-8 text-center text-sm text-secondary">{t('empty')}</p>;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <article key={report.id} className="rounded-2xl surface-card border p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">
                {report.review?.company?.name ?? t('unknownCompany')}
              </p>
              <p className="text-xs text-secondary">
                {t('reportedBy', { email: report.reporterEmail ?? t('unknownReporter') })}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[report.status]}`}
            >
              {t(`status.${report.status}`)}
            </span>
          </div>

          {report.review ? (
            <div className="mt-3 rounded-xl border border-subtle p-3">
              <div className="flex items-center gap-2">
                <StarRating value={report.review.rating} size="sm" />
                <span className="text-xs text-secondary">
                  {new Date(report.review.createdAt).toLocaleDateString(locale)}
                </span>
              </div>
              {report.review.title ? (
                <p className="mt-2 text-sm font-medium text-primary">{report.review.title}</p>
              ) : null}
              <p className="mt-1 line-clamp-4 text-sm text-secondary">{report.review.content}</p>
            </div>
          ) : null}

          {report.reason ? (
            <p className="mt-3 text-sm text-secondary">
              <span className="font-medium text-primary">{t('reason')}:</span> {report.reason}
            </p>
          ) : null}

          {report.status === 'pending' ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={actingId === report.id}
                onClick={() => void act(report.id, 'approve')}
              >
                {actingId === report.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('approve')
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={actingId === report.id}
                onClick={() => void act(report.id, 'reject')}
              >
                {t('reject')}
              </Button>
            </div>
          ) : null}
        </article>
      ))}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t('previous')}
          </Button>
          <span className="text-sm text-secondary">{t('pageOf', { page, total: totalPages })}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('next')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

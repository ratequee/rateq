'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { companiesApi, reviewsApi } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type {
  CategoryPublic,
  PaginatedReviewsResponse,
  ReviewPublic,
  ReviewStatus,
} from '@rateq/types';
import { Link } from '@/i18n/routing';
import { Loader2, MessageSquareText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ReviewsPanelMode = 'admin' | 'reviewer' | 'company';

interface ReviewsManagementPanelProps {
  mode: ReviewsPanelMode;
  companyId?: string;
}

const STATUS_OPTIONS: Array<ReviewStatus | 'all'> = [
  'all',
  'PENDING',
  'RESOLUTION_PENDING',
  'APPROVED',
  'REJECTED',
];

const statusStyles: Record<ReviewStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  RESOLUTION_PENDING: 'bg-sky-50 text-sky-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

function buildParams(input: {
  page: number;
  limit: number;
  status: ReviewStatus | 'all';
  categoryId: string;
  search: string;
}) {
  const params = new URLSearchParams();
  params.set('page', String(input.page));
  params.set('limit', String(input.limit));
  if (input.status !== 'all') params.set('status', input.status);
  if (input.categoryId) params.set('categoryId', input.categoryId);
  if (input.search.trim()) params.set('search', input.search.trim());
  return params;
}

export function ReviewsManagementPanel({ mode, companyId }: ReviewsManagementPanelProps) {
  const t = useTranslations('dashboardReviews');
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [meta, setMeta] = useState<PaginatedReviewsResponse['meta'] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReviewStatus | 'all'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedId) ?? null,
    [reviews, selectedId],
  );

  useEffect(() => {
    void fetchCategoriesClient().then(setCategories);
  }, []);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) throw new Error(t('sessionExpired'));

      const params = buildParams({ page, limit, status, categoryId, search });
      let response: PaginatedReviewsResponse;

      if (mode === 'admin') {
        response = await reviewsApi.listAdmin(token, params);
      } else if (mode === 'reviewer') {
        response = await reviewsApi.listMine(token, params);
      } else {
        if (!companyId) {
          setReviews([]);
          setMeta(null);
          return;
        }
        response = await reviewsApi.listByCompanyManage(token, companyId, params);
      }

      setReviews(response.data);
      setMeta(response.meta);
      setSelectedId((current) => {
        if (response.data.length === 0) return null;
        if (current && response.data.some((item) => item.id === current)) return current;
        return response.data[0]?.id ?? null;
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
      setReviews([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [mode, companyId, page, status, categoryId, search, t]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setActing(true);
    try {
      await action();
      toast.success(successMessage);
      await loadReviews();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setActing(false);
    }
  };

  const handleAdminApprove = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.approve(token, reviewId), t('approvedSuccess'));
  };

  const handleAdminReject = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.reject(token, reviewId), t('rejectedSuccess'));
  };

  const handleAdminResolve = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.resolve(token, reviewId), t('resolveSuccess'));
  };

  const handleAdminDelete = async (reviewId: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.deleteReview(token, reviewId), t('deleteSuccess'));
  };

  const handleAdminDeleteReply = async (reviewId: string) => {
    if (!window.confirm(t('deleteReplyConfirm'))) return;

    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.deleteReviewReply(token, reviewId), t('deleteReplySuccess'));
  };

  const handleProceed = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.proceedResolution(token, reviewId), t('proceedSuccess'));
  };

  const handleWithdraw = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.withdrawResolution(token, reviewId), t('withdrawSuccess'));
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-10 sm:col-span-2"
            />
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as ReviewStatus | 'all');
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? t('allStatuses') : t(`status.${option}`)}
                </option>
              ))}
            </select>
            <select
              value={categoryId}
              onChange={(e) => {
                setPage(1);
                setCategoryId(e.target.value);
              }}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline-brand"
              className="h-10 sm:col-span-2"
              onClick={() => {
                setPage(1);
                setSearch(searchInput);
              }}
            >
              {t('applyFilters')}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-ink">{t('reviewsTitle')}</h2>
            {meta ? (
              <p className="mt-1 text-sm text-ink-muted">
                {t('resultsCount', { count: meta.total })}
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-5 py-16 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-ink-muted">{t('empty')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => setSelectedId(review.id)}
                  className={cn(
                    'w-full px-5 py-4 text-start transition-colors hover:bg-slate-50',
                    selectedId === review.id && 'bg-brand-50/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{review.title}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {mode === 'reviewer'
                          ? review.company?.name
                          : (review.author?.displayName ?? t('unknownReviewer'))}
                        {review.company?.categoryName ? ` · ${review.company.categoryName}` : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                        statusStyles[review.status],
                      )}
                    >
                      {t(`status.${review.status}`)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-xs text-ink-muted">
                      {new Date(review.createdAt).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t('previous')}
              </Button>
              <span className="text-sm text-ink-muted">
                {t('pageOf', { page, total: totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                {t('next')}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {!selectedReview ? (
          <p className="py-16 text-center text-sm text-ink-muted">{t('selectReview')}</p>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-ink">{selectedReview.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {selectedReview.company?.name ?? t('unknownCompany')}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                    statusStyles[selectedReview.status],
                  )}
                >
                  {t(`status.${selectedReview.status}`)}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <StarRating value={selectedReview.rating} />
                <span className="text-sm text-ink-muted">
                  {new Date(selectedReview.createdAt).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink">{t('reviewContent')}</p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-ink-muted">
                {selectedReview.content}
              </p>
            </div>

            {selectedReview.reply ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <MessageSquareText className="h-4 w-4" />
                    {t('companyReply')}
                  </div>
                  {mode === 'admin' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={acting}
                      onClick={() => void handleAdminDeleteReply(selectedReview.id)}
                    >
                      {t('deleteReply')}
                    </Button>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-ink-muted">
                  {selectedReview.reply.content}
                </p>
              </div>
            ) : null}

            {mode === 'admin' ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                {selectedReview.status === 'RESOLUTION_PENDING' ? (
                  <p className="text-sm text-ink-muted">{t('adminResolutionHint')}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={acting || selectedReview.status !== 'PENDING'}
                    onClick={() => void handleAdminApprove(selectedReview.id)}
                  >
                    {t('accept')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={acting || selectedReview.status !== 'PENDING'}
                    onClick={() => void handleAdminReject(selectedReview.id)}
                  >
                    {t('reject')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-brand"
                    disabled={
                      acting || selectedReview.status !== 'PENDING' || selectedReview.rating > 3
                    }
                    onClick={() => void handleAdminResolve(selectedReview.id)}
                  >
                    {t('resolve')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={acting}
                    onClick={() => void handleAdminDelete(selectedReview.id)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            ) : null}

            {mode === 'reviewer' &&
            selectedReview.status === 'REJECTED' &&
            selectedReview.company?.slug ? (
              <div className="border-t border-slate-100 pt-4">
                <Link href={`/companies/${selectedReview.company.slug}#write-review`}>
                  <Button type="button" variant="outline-brand">
                    {t('reviewAgain')}
                  </Button>
                </Link>
              </div>
            ) : null}

            {mode === 'reviewer' && selectedReview.status === 'RESOLUTION_PENDING' ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-sm text-ink-muted">{t('resolutionHint')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={acting}
                    onClick={() => void handleProceed(selectedReview.id)}
                  >
                    {t('proceed')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={acting}
                    onClick={() => void handleWithdraw(selectedReview.id)}
                  >
                    {t('withdraw')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

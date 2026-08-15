'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { canCompanyReplyToReview } from '@/lib/review-reply';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { getCategoryLabel, getLocalizedCategoryName } from '@/lib/category-label';
import { reviewsApi } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CategoryPublic, PaginatedReviewsResponse, ReviewPublic } from '@rateq/types';
import { ReviewReplyStatus, ReviewStatus } from '@rateq/types';
import { Link, useRouter } from '@/i18n/routing';
import { Loader2, MessageSquareText } from 'lucide-react';
import { ReviewProofAttachments } from '@/components/dashboard/review-proof-attachments';
import { ReviewReplyForm } from '@/components/review/review-reply-form';
import { ReviewReplyStatusBadge } from '@/components/review/review-reply-status-badge';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type ReviewsPanelMode = 'admin' | 'reviewer' | 'company';

interface ReviewsManagementPanelProps {
  mode: ReviewsPanelMode;
  companyId?: string;
}

const STATUS_OPTIONS: Array<ReviewStatus | 'all'> = [
  'all',
  ReviewStatus.PENDING,
  ReviewStatus.RESOLUTION_PENDING,
  ReviewStatus.MODIFIED,
  ReviewStatus.PROCEEDED,
  ReviewStatus.WITHDRAWN,
  ReviewStatus.APPROVED,
  ReviewStatus.REJECTED,
  ReviewStatus.DELETED,
];

const COMPANY_STATUS_OPTIONS: Array<ReviewStatus | 'all'> = [
  'all',
  ReviewStatus.APPROVED,
  ReviewStatus.RESOLUTION_PENDING,
];

const statusStyles: Record<ReviewStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  RESOLUTION_PENDING: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  MODIFIED: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  PROCEEDED: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  WITHDRAWN: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  DELETED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const ADMIN_MODERATABLE_STATUSES: ReviewStatus[] = [
  ReviewStatus.PENDING,
  ReviewStatus.MODIFIED,
  ReviewStatus.PROCEEDED,
];

const RESOLUTION_RELATED_STATUSES: ReviewStatus[] = [
  ReviewStatus.RESOLUTION_PENDING,
  ReviewStatus.MODIFIED,
  ReviewStatus.PROCEEDED,
  ReviewStatus.WITHDRAWN,
];

function isNewReviewerAccount(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= 0 && ageMs < 7 * 24 * 60 * 60 * 1000;
}

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

function isResolutionDeadlinePassed(review: ReviewPublic): boolean {
  if (!review.resolutionDeadlineAt) return false;
  return Date.now() >= new Date(review.resolutionDeadlineAt).getTime();
}

export function ReviewsManagementPanel({ mode, companyId }: ReviewsManagementPanelProps) {
  const t = useTranslations('dashboardReviews');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [statusCounts, setStatusCounts] = useState<Partial<Record<ReviewStatus | 'all', number>>>(
    {},
  );
  const limit = 10;
  const loadSeq = useRef(0);

  const statusOptions = useMemo(
    () => (mode === 'company' ? COMPANY_STATUS_OPTIONS : STATUS_OPTIONS),
    [mode],
  );

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedId) ?? null,
    [reviews, selectedId],
  );

  useEffect(() => {
    if (mode === 'company') return;
    void fetchCategoriesClient().then(setCategories);
  }, [mode]);

  useEffect(() => {
    const initialSearch = searchParams.get('search')?.trim() ?? '';
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedReview) return;
    setEditTitle(selectedReview.title);
    setEditContent(selectedReview.content);
    setEditRating(selectedReview.rating);
    setEditing(false);
  }, [selectedReview?.id]);

  const loadReviews = useCallback(
    async (options?: { silent?: boolean }) => {
      const seq = ++loadSeq.current;
      if (!options?.silent) setLoading(true);
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
            if (seq !== loadSeq.current) return;
            setReviews([]);
            setMeta(null);
            return;
          }
          response = await reviewsApi.listByCompanyManage(token, companyId, params);
        }

        if (seq !== loadSeq.current) return;

        if (response.data.length === 0 && page > 1) {
          setPage(1);
          return;
        }

        setReviews(response.data);
        setMeta(response.meta);
        setSelectedId((current) => {
          if (response.data.length === 0) return null;
          if (current && response.data.some((item) => item.id === current)) return current;
          return response.data[0]?.id ?? null;
        });
      } catch (err) {
        if (seq !== loadSeq.current) return;
        const message = err instanceof ApiError ? err.message : t('loadError');
        toast.error(message);
        setReviews([]);
        setMeta(null);
      } finally {
        if (seq === loadSeq.current && !options?.silent) setLoading(false);
      }
    },
    [mode, companyId, page, status, categoryId, search, t],
  );

  const loadStatusCounts = useCallback(async () => {
    const token = await ensureValidAccessToken();
    if (!token || (mode === 'company' && !companyId)) return;

    const responses = await Promise.all(
      statusOptions.map((option) => {
        const params = buildParams({
          page: 1,
          limit: 1,
          status: option,
          categoryId: '',
          search: '',
        });
        if (mode === 'admin') return reviewsApi.listAdmin(token, params);
        if (mode === 'reviewer') return reviewsApi.listMine(token, params);
        return reviewsApi.listByCompanyManage(token, companyId!, params);
      }),
    );
    setStatusCounts(
      Object.fromEntries(
        statusOptions.map((option, index) => [option, responses[index]?.meta.total ?? 0]),
      ),
    );
  }, [companyId, mode, statusOptions]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    void loadStatusCounts();
  }, [loadStatusCounts]);

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    reviewId?: string,
  ) => {
    setActing(true);
    try {
      await action();
      toast.success(successMessage);
      if (reviewId && status !== 'all') {
        setReviews((current) => current.filter((review) => review.id !== reviewId));
        setSelectedId((current) =>
          current === reviewId
            ? (reviews.find((review) => review.id !== reviewId)?.id ?? null)
            : current,
        );
      }
      await loadReviews({ silent: true });
      await loadStatusCounts();
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
      await loadReviews({ silent: true });
      await loadStatusCounts();
    } finally {
      setActing(false);
    }
  };

  const handleAdminApprove = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.approve(token, reviewId), t('approvedSuccess'), reviewId);
  };

  const handleAdminReject = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.reject(token, reviewId), t('rejectedSuccess'), reviewId);
  };

  const handleAdminResolve = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.resolve(token, reviewId), t('resolveSuccess'), reviewId);
  };

  const handleAdminDelete = async (reviewId: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.deleteReview(token, reviewId), t('deleteSuccess'), reviewId);
  };

  const handleAdminDeleteReply = async (reviewId: string) => {
    if (!window.confirm(t('deleteReplyConfirm'))) return;

    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.deleteReviewReply(token, reviewId), t('deleteReplySuccess'));
  };

  const handleAdminApproveReply = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () => reviewsApi.approveReviewReply(token, reviewId),
      t('replyApprovedSuccess'),
    );
  };

  const handleAdminRejectReply = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.rejectReviewReply(token, reviewId), t('replyRejectedSuccess'));
  };

  const handleProceed = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () => reviewsApi.proceedResolution(token, reviewId),
      t('proceedSuccess'),
      reviewId,
    );
  };

  const handleWithdraw = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () => reviewsApi.withdrawResolution(token, reviewId),
      t('withdrawSuccess'),
      reviewId,
    );
  };

  const handleModify = async (reviewId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () =>
        reviewsApi.modifyResolution(token, reviewId, {
          rating: editRating,
          title: editTitle,
          content: editContent,
        }),
      t('modifySuccess'),
      reviewId,
    );
    setEditing(false);
  };

  const handleSetResolutionWindow = async (reviewId: string, days: 7 | 14) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () => reviewsApi.setResolutionWindow(token, reviewId, days),
      t('resolutionWindowSet', { days }),
    );
  };

  const resolutionDeadlinePassed = selectedReview
    ? isResolutionDeadlinePassed(selectedReview)
    : false;
  const adminCanModerate = selectedReview
    ? ADMIN_MODERATABLE_STATUSES.includes(selectedReview.status)
    : false;

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="surface-card p-4">
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
              className="select-field sm:col-span-2"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? t('allStatuses') : t(`status.${option}`)} (
                  {statusCounts[option] ?? '—'})
                </option>
              ))}
            </select>
            {mode !== 'company' ? (
              <select
                value={categoryId}
                onChange={(e) => {
                  setPage(1);
                  setCategoryId(e.target.value);
                }}
                className="select-field sm:col-span-2"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryLabel(category, locale)}
                  </option>
                ))}
              </select>
            ) : null}
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

        <div className="surface-card overflow-hidden">
          <div className="border-b border-subtle px-5 py-4">
            <h2 className="text-lg font-bold text-primary">{t('reviewsTitle')}</h2>
            {meta ? (
              <p className="mt-1 text-sm text-secondary">
                {t('resultsCount', { count: meta.total })}
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-5 py-16 text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-secondary">{t('empty')}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-dm-border">
              {reviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => setSelectedId(review.id)}
                  className={cn(
                    'w-full px-5 py-4 text-start dashboard-list-hover',
                    selectedId === review.id && 'dashboard-list-selected',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-primary">{review.title}</p>
                      <p className="mt-1 text-sm text-secondary">
                        {mode === 'reviewer'
                          ? review.company?.name
                          : (review.author?.displayName ?? t('unknownReviewer'))}
                        {(() => {
                          const categoryLabel = review.company
                            ? getLocalizedCategoryName(review.company, locale)
                            : null;
                          return categoryLabel ? ` · ${categoryLabel}` : '';
                        })()}
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
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-xs text-secondary">
                      {new Date(review.createdAt).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {mode === 'admin' && isNewReviewerAccount(review.author?.createdAt) ? (
                      <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                        {t('newAccountReview')}
                      </span>
                    ) : null}
                    {review.reply?.status === ReviewReplyStatus.PENDING ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        {t('replyPendingInList')}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-subtle px-5 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t('previous')}
              </Button>
              <span className="text-sm text-secondary">
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

      <div className="surface-card p-5">
        {!selectedReview ? (
          <p className="py-16 text-center text-sm text-secondary">{t('selectReview')}</p>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedReview.title}</h3>
                  <p className="mt-1 text-sm text-secondary">
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
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StarRating value={selectedReview.rating} />
                <span className="text-sm text-secondary">
                  {new Date(selectedReview.createdAt).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                {selectedReview.resolutionDeadlineAt ? (
                  <span className="text-sm text-secondary">
                    {t('resolutionDeadline')}:{' '}
                    {new Date(selectedReview.resolutionDeadlineAt).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                ) : null}
              </div>
            </div>

            {mode === 'admin' && (selectedReview.resolutionSentCount ?? 0) > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                <p className="text-xs font-medium text-secondary">
                  {t('resolutionSentCountLabel')}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {t('resolutionSentCount', { count: selectedReview.resolutionSentCount ?? 0 })}
                </p>
              </div>
            ) : null}

            {RESOLUTION_RELATED_STATUSES.includes(selectedReview.status) ? (
              <div className="grid gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900/60 dark:bg-sky-950/20 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-secondary">{t('resolutionSelection')}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {selectedReview.resolutionWindowDays
                      ? t('resolutionSelectedDays', {
                          days: selectedReview.resolutionWindowDays,
                        })
                      : t('resolutionNotSelected')}
                  </p>
                  {selectedReview.resolutionDeadlineAt ? (
                    <p className="mt-1 text-sm text-secondary">
                      {t('resolutionDeadline')}:{' '}
                      {new Date(selectedReview.resolutionDeadlineAt).toLocaleString(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  ) : null}
                </div>
                {(mode === 'admin' || mode === 'company') && selectedReview.reviewerContact ? (
                  <div>
                    <p className="text-xs font-medium text-secondary">{t('reviewerContact')}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {selectedReview.reviewerContact.name}
                    </p>
                    <a
                      href={`mailto:${selectedReview.reviewerContact.email}`}
                      className="block break-all text-sm text-brand-500 hover:underline"
                    >
                      {selectedReview.reviewerContact.email}
                    </a>
                    {selectedReview.reviewerContact.phone ? (
                      <a
                        href={`tel:${selectedReview.reviewerContact.phone.replace(/[^\d+]/g, '')}`}
                        className="block text-sm text-brand-500 hover:underline"
                        dir="ltr"
                      >
                        {selectedReview.reviewerContact.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-secondary">{t('phoneNotProvided')}</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-semibold text-primary">{t('reviewContent')}</p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-secondary">
                {selectedReview.content}
              </p>
            </div>

            <ReviewProofAttachments attachments={selectedReview.attachments} />

            {selectedReview.reply ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                      <MessageSquareText className="h-4 w-4" />
                      {t('companyReply')}
                    </div>
                    <ReviewReplyStatusBadge status={selectedReview.reply.status} />
                  </div>
                  {mode === 'admin' ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedReview.reply.status === ReviewReplyStatus.PENDING ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={acting}
                            onClick={() => void handleAdminApproveReply(selectedReview.id)}
                          >
                            {t('acceptReply')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={acting}
                            onClick={() => void handleAdminRejectReply(selectedReview.id)}
                          >
                            {t('rejectReply')}
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={acting}
                        onClick={() => void handleAdminDeleteReply(selectedReview.id)}
                      >
                        {t('deleteReply')}
                      </Button>
                    </div>
                  ) : null}
                </div>
                {mode === 'company' && selectedReview.reply.status === ReviewReplyStatus.PENDING ? (
                  <p className="mb-2 text-sm text-amber-800 dark:text-amber-200">
                    {t('replyPendingHint')}
                  </p>
                ) : null}
                {mode === 'company' &&
                selectedReview.reply.status === ReviewReplyStatus.REJECTED ? (
                  <p className="mb-2 text-sm text-red-800 dark:text-red-200">
                    {t('replyRejectedHint')}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-7 text-ink dark:text-slate-200">
                  {selectedReview.reply.content}
                </p>
              </div>
            ) : null}

            {mode === 'company' && companyId && canCompanyReplyToReview(selectedReview) ? (
              <ReviewReplyForm
                review={selectedReview}
                companyId={companyId}
                trustedOwner
                onReplied={(updated) => {
                  setReviews((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                  );
                }}
              />
            ) : null}

            {mode === 'admin' ? (
              <div className="space-y-3 border-t border-subtle pt-4">
                {selectedReview.status === 'RESOLUTION_PENDING' ? (
                  <p className="text-sm text-secondary">
                    {selectedReview.resolutionDeadlineAt
                      ? t('adminResolutionHint')
                      : t('adminResolutionAwaitingCompanyHint')}
                  </p>
                ) : null}
                {selectedReview.status === 'MODIFIED' ? (
                  <p className="text-sm text-secondary">{t('adminModifiedHint')}</p>
                ) : null}
                {selectedReview.status === 'PROCEEDED' ? (
                  <p className="text-sm text-secondary">{t('adminProceededHint')}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={acting || !adminCanModerate}
                    onClick={() => void handleAdminApprove(selectedReview.id)}
                  >
                    {t('accept')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={acting || !adminCanModerate}
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
                  {selectedReview.status !== 'DELETED' ? (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={acting}
                      onClick={() => void handleAdminDelete(selectedReview.id)}
                    >
                      {t('delete')}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {mode === 'reviewer' &&
            (selectedReview.status === 'REJECTED' ||
              selectedReview.status === 'WITHDRAWN' ||
              selectedReview.status === 'DELETED') &&
            selectedReview.company?.slug ? (
              <div className="border-t border-subtle pt-4">
                <Link href={`/companies/${selectedReview.company.slug}#write-review`}>
                  <Button type="button" variant="outline-brand">
                    {t('reviewAgain')}
                  </Button>
                </Link>
              </div>
            ) : null}

            {mode === 'company' && selectedReview.status === 'RESOLUTION_PENDING' ? (
              <div className="space-y-3 border-t border-subtle pt-4">
                {!selectedReview.resolutionDeadlineAt ? (
                  <>
                    <p className="text-sm text-secondary">{t('companyResolutionHint')}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {t('companyResolutionDeadlineHint')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={acting}
                        onClick={() => void handleSetResolutionWindow(selectedReview.id, 7)}
                      >
                        {t('setWindow7')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-brand"
                        disabled={acting}
                        onClick={() => void handleSetResolutionWindow(selectedReview.id, 14)}
                      >
                        {t('setWindow14')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-secondary">
                    {t('resolutionWindowActive', {
                      date: new Date(selectedReview.resolutionDeadlineAt).toLocaleString(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }),
                    })}
                  </p>
                )}
              </div>
            ) : null}

            {mode === 'reviewer' && selectedReview.status === 'RESOLUTION_PENDING' ? (
              <div className="space-y-3 border-t border-subtle pt-4">
                <p className="text-sm text-secondary">
                  {!selectedReview.resolutionDeadlineAt
                    ? t('resolutionWaitingCompany')
                    : resolutionDeadlinePassed
                      ? t('resolutionProceedHint')
                      : t('resolutionDuringWindowHint', {
                          date: new Date(selectedReview.resolutionDeadlineAt).toLocaleString(
                            locale,
                            {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            },
                          ),
                        })}
                </p>

                {selectedReview.resolutionDeadlineAt && editing ? (
                  <div className="space-y-3 rounded-xl border border-subtle p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-primary">
                        {t('editRating')}
                      </label>
                      <StarRating
                        value={editRating}
                        size="md"
                        interactive
                        onChange={setEditRating}
                      />
                    </div>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder={t('editTitle')}
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="textarea-field"
                      placeholder={t('editContent')}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={acting}
                        onClick={() => void handleModify(selectedReview.id)}
                      >
                        {t('saveModification')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={acting}
                        onClick={() => setEditing(false)}
                      >
                        {t('cancelEdit')}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {selectedReview.resolutionDeadlineAt ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline-brand"
                      disabled={acting || editing}
                      onClick={() => setEditing(true)}
                    >
                      {t('editReview')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={acting}
                      onClick={() => void handleWithdraw(selectedReview.id)}
                    >
                      {t('withdraw')}
                    </Button>
                    {resolutionDeadlinePassed ? (
                      <Button
                        type="button"
                        disabled={acting}
                        onClick={() => void handleProceed(selectedReview.id)}
                      >
                        {t('proceed')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { AdminCompanyMetrics } from '@/components/dashboard/admin-company-metrics';
import { ReviewsManagementPanel } from '@/components/dashboard/reviews-management-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { adminApi } from '@/lib/admin-platform-api';
import { ApiError, reviewsApi, usersApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { cn } from '@/lib/utils';
import type {
  AdminCompanyDetail,
  AdminCompanyListItem,
  AdminUserDetail,
  ReviewPublic,
  UserProfile,
} from '@rateq/types';
import { UserRole } from '@rateq/types';
import { Building2, Loader2, MessageSquareText, Star, Trash2, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type DirectoryTab = 'reviewers' | 'companies' | 'reviews';

const reviewStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  RESOLUTION_PENDING: 'bg-sky-50 text-sky-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

function EntityReviewsList({
  reviews,
  acting,
  onDeleteReview,
  onDeleteReply,
}: {
  reviews: ReviewPublic[];
  acting: boolean;
  onDeleteReview: (reviewId: string) => void;
  onDeleteReply: (reviewId: string) => void;
}) {
  const t = useTranslations('adminDirectory');
  const tr = useTranslations('dashboardReviews');
  const locale = useLocale();

  if (!reviews.length) {
    return <p className="text-sm text-secondary">{t('noReviews')}</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-xl border border-slate-100 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-primary">{review.title}</p>
              <p className="mt-1 text-xs text-secondary">
                {review.company?.name ?? tr('unknownCompany')} ·{' '}
                {review.author?.displayName ?? tr('unknownReviewer')}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                reviewStatusStyles[review.status],
              )}
            >
              {tr(`status.${review.status}`)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={review.rating} size="sm" />
            <span className="text-xs text-secondary">
              {new Date(review.createdAt).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-secondary">{review.content}</p>
          {review.reply ? (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {tr('companyReply')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={acting}
                  onClick={() => onDeleteReply(review.id)}
                >
                  {tr('deleteReply')}
                </Button>
              </div>
              <p className="text-sm text-secondary">{review.reply.content}</p>
            </div>
          ) : null}
          <div className="mt-3">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={acting}
              onClick={() => onDeleteReview(review.id)}
            >
              <Trash2 className="me-1.5 h-3.5 w-3.5" />
              {tr('delete')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDirectoryPanel() {
  const t = useTranslations('adminDirectory');
  const tr = useTranslations('dashboardReviews');
  const tc = useTranslations('adminCompanies');
  const [tab, setTab] = useState<DirectoryTab>('reviewers');

  const [reviewers, setReviewers] = useState<UserProfile[]>([]);
  const [reviewerPage, setReviewerPage] = useState(1);
  const [reviewerTotalPages, setReviewerTotalPages] = useState(1);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [reviewerSearchInput, setReviewerSearchInput] = useState('');
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [reviewerDetail, setReviewerDetail] = useState<AdminUserDetail | null>(null);

  const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
  const [companyPage, setCompanyPage] = useState(1);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);
  const [companySearch, setCompanySearch] = useState('');
  const [companySearchInput, setCompanySearchInput] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDetail, setCompanyDetail] = useState<AdminCompanyDetail | null>(null);

  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const loadReviewers = useCallback(async () => {
    setListLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;
      const params = new URLSearchParams();
      params.set('page', String(reviewerPage));
      params.set('limit', '15');
      params.set('role', UserRole.USER);
      if (reviewerSearch.trim()) params.set('search', reviewerSearch.trim());
      const response = await usersApi.list(token, params);
      setReviewers(response.data);
      setReviewerTotalPages(response.meta.totalPages);
      if (response.data.length && !response.data.some((u) => u.id === selectedReviewerId)) {
        setSelectedReviewerId(response.data[0]?.id ?? null);
      }
      if (!response.data.length) setSelectedReviewerId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('loadError'));
      setReviewers([]);
    } finally {
      setListLoading(false);
    }
  }, [reviewerPage, reviewerSearch, selectedReviewerId, t]);

  const loadCompanies = useCallback(async () => {
    setListLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;
      const params = new URLSearchParams();
      params.set('page', String(companyPage));
      params.set('limit', '15');
      if (companySearch.trim()) params.set('search', companySearch.trim());
      const response = await adminApi.listCompanies(token, params);
      setCompanies(response.data);
      setCompanyTotalPages(response.meta.totalPages);
      if (response.data.length && !response.data.some((c) => c.id === selectedCompanyId)) {
        setSelectedCompanyId(response.data[0]?.id ?? null);
      }
      if (!response.data.length) setSelectedCompanyId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('loadError'));
      setCompanies([]);
    } finally {
      setListLoading(false);
    }
  }, [companyPage, companySearch, selectedCompanyId, t]);

  useEffect(() => {
    if (tab === 'reviewers') void loadReviewers();
  }, [tab, loadReviewers]);

  useEffect(() => {
    if (tab === 'companies') void loadCompanies();
  }, [tab, loadCompanies]);

  useEffect(() => {
    if (tab !== 'reviewers' || !selectedReviewerId) {
      setReviewerDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const token = await ensureValidAccessToken();
        if (!token || cancelled) return;
        setReviewerDetail(await adminApi.getUserDetail(token, selectedReviewerId));
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : t('loadError'));
          setReviewerDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, selectedReviewerId, t]);

  useEffect(() => {
    if (tab !== 'companies' || !selectedCompanyId) {
      setCompanyDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const token = await ensureValidAccessToken();
        if (!token || cancelled) return;
        setCompanyDetail(await adminApi.getCompanyDetail(token, selectedCompanyId));
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : t('loadError'));
          setCompanyDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, selectedCompanyId, t]);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setActing(true);
    try {
      await action();
      toast.success(successMessage);
      if (tab === 'reviewers') {
        await loadReviewers();
        if (selectedReviewerId) {
          const token = await ensureValidAccessToken();
          if (token) {
            setReviewerDetail(await adminApi.getUserDetail(token, selectedReviewerId));
          }
        }
      } else if (tab === 'companies') {
        await loadCompanies();
        if (selectedCompanyId) {
          const token = await ensureValidAccessToken();
          if (token) {
            setCompanyDetail(await adminApi.getCompanyDetail(token, selectedCompanyId));
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tr('actionError'));
    } finally {
      setActing(false);
    }
  };

  const handleToggleReviewerActive = async (user: UserProfile) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () => adminApi.updateUser(token, user.id, { isActive: !user.isActive }),
      user.isActive ? t('deactivateSuccess') : t('activateSuccess'),
    );
  };

  const handleDeleteReviewer = async (userId: string) => {
    if (!window.confirm(t('deleteReviewerConfirm'))) return;
    const token = await ensureValidAccessToken();
    if (!token) return;
    setSelectedReviewerId(null);
    setReviewerDetail(null);
    await runAction(() => adminApi.deleteUser(token, userId), t('deleteSuccess'));
  };

  const handleToggleCompanyOwnerActive = async (ownerId: string, isActive: boolean) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(
      () => adminApi.updateUser(token, ownerId, { isActive: !isActive }),
      isActive ? t('deactivateSuccess') : t('activateSuccess'),
    );
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm(t('deleteCompanyConfirm'))) return;
    const token = await ensureValidAccessToken();
    if (!token) return;
    setSelectedCompanyId(null);
    setCompanyDetail(null);
    await runAction(() => adminApi.deleteCompany(token, companyId), t('deleteSuccess'));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm(tr('deleteConfirm'))) return;
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.deleteReview(token, reviewId), tr('deleteSuccess'));
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!window.confirm(tr('deleteReplyConfirm'))) return;
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(() => reviewsApi.deleteReviewReply(token, reviewId), tr('deleteReplySuccess'));
  };

  const tabs: Array<{ id: DirectoryTab; label: string; icon: typeof Users }> = [
    { id: 'reviewers', label: t('tabs.reviewers'), icon: Users },
    { id: 'companies', label: t('tabs.companies'), icon: Building2 },
    { id: 'reviews', label: t('tabs.reviews'), icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-brand-500 text-white'
                : 'border border-slate-200 bg-white text-secondary hover:bg-brand-50 hover:text-brand-600',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'reviews' ? <ReviewsManagementPanel mode="admin" /> : null}

      {tab === 'reviewers' ? (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="rounded-2xl surface-card border p-4 shadow-sm">
            <form
              className="mb-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setReviewerPage(1);
                setReviewerSearch(reviewerSearchInput);
              }}
            >
              <Input
                value={reviewerSearchInput}
                onChange={(event) => setReviewerSearchInput(event.target.value)}
                placeholder={t('searchReviewers')}
              />
              <Button type="submit" variant="outline">
                {t('search')}
              </Button>
            </form>
            {listLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : (
              <div className="max-h-[520px] space-y-1 overflow-y-auto">
                {reviewers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedReviewerId(user.id)}
                    className={cn(
                      'flex w-full flex-col rounded-xl px-3 py-3 text-start transition-colors',
                      selectedReviewerId === user.id
                        ? 'bg-brand-50 text-brand-700'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <span className="font-medium text-primary">
                      {user.fullName ?? user.displayName ?? user.email}
                    </span>
                    <span className="text-xs text-secondary">{user.email}</span>
                    <span className="mt-1 text-xs text-secondary">
                      {t('reviewCount', { count: user.reviewCount })}
                      {!user.isActive ? ` · ${t('inactive')}` : ''}
                    </span>
                  </button>
                ))}
                {!reviewers.length ? (
                  <p className="py-8 text-center text-sm text-secondary">{t('emptyReviewers')}</p>
                ) : null}
              </div>
            )}
            {reviewerTotalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={reviewerPage <= 1 || listLoading}
                  onClick={() => setReviewerPage((p) => p - 1)}
                >
                  {tr('previous')}
                </Button>
                <span className="text-xs text-secondary">
                  {tr('pageOf', { page: reviewerPage, total: reviewerTotalPages })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={reviewerPage >= reviewerTotalPages || listLoading}
                  onClick={() => setReviewerPage((p) => p + 1)}
                >
                  {tr('next')}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl surface-card border p-5 shadow-sm">
            {detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : !reviewerDetail ? (
              <p className="py-16 text-center text-sm text-secondary">{t('selectReviewer')}</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-primary">
                      {reviewerDetail.fullName ??
                        reviewerDetail.displayName ??
                        reviewerDetail.email}
                    </h3>
                    <p className="mt-1 text-sm text-secondary">{reviewerDetail.email}</p>
                    {reviewerDetail.city || reviewerDetail.country ? (
                      <p className="text-sm text-secondary">
                        {[reviewerDetail.city, reviewerDetail.country].filter(Boolean).join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                      reviewerDetail.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700',
                    )}
                  >
                    {reviewerDetail.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={acting}
                    onClick={() => void handleToggleReviewerActive(reviewerDetail)}
                  >
                    {reviewerDetail.isActive ? t('deactivate') : t('activate')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={acting}
                    onClick={() => void handleDeleteReviewer(reviewerDetail.id)}
                  >
                    {t('deleteAccount')}
                  </Button>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-primary">
                    {t('reviewsAndReplies')}
                  </h4>
                  <EntityReviewsList
                    reviews={reviewerDetail.reviews}
                    acting={acting}
                    onDeleteReview={(id) => void handleDeleteReview(id)}
                    onDeleteReply={(id) => void handleDeleteReply(id)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'companies' ? (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="rounded-2xl surface-card border p-4 shadow-sm">
            <form
              className="mb-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setCompanyPage(1);
                setCompanySearch(companySearchInput);
              }}
            >
              <Input
                value={companySearchInput}
                onChange={(event) => setCompanySearchInput(event.target.value)}
                placeholder={t('searchCompanies')}
              />
              <Button type="submit" variant="outline">
                {t('search')}
              </Button>
            </form>
            {listLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : (
              <div className="max-h-[520px] space-y-1 overflow-y-auto">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={cn(
                      'w-full rounded-xl px-3 py-3 text-start transition-colors',
                      selectedCompanyId === company.id
                        ? 'bg-brand-50 text-brand-700'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-medium text-primary">{company.name}</span>
                        <span className="mt-0.5 block text-xs text-secondary">
                          {company.city}, {company.country}
                        </span>
                      </div>
                      <AdminCompanyMetrics
                        reviewCount={company.reviewCount}
                        pageVisitCount={company.pageVisitCount}
                      />
                    </div>
                    <span className="mt-2 block text-xs text-secondary">
                      {tc(`status.${company.verificationStatus}`)}
                    </span>
                  </button>
                ))}
                {!companies.length ? (
                  <p className="py-8 text-center text-sm text-secondary">{t('emptyCompanies')}</p>
                ) : null}
              </div>
            )}
            {companyTotalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={companyPage <= 1 || listLoading}
                  onClick={() => setCompanyPage((p) => p - 1)}
                >
                  {tr('previous')}
                </Button>
                <span className="text-xs text-secondary">
                  {tr('pageOf', { page: companyPage, total: companyTotalPages })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={companyPage >= companyTotalPages || listLoading}
                  onClick={() => setCompanyPage((p) => p + 1)}
                >
                  {tr('next')}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl surface-card border p-5 shadow-sm">
            {detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : !companyDetail ? (
              <p className="py-16 text-center text-sm text-secondary">{t('selectCompany')}</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{companyDetail.name}</h3>
                    <p className="mt-1 text-sm text-secondary">
                      {companyDetail.city}, {companyDetail.country}
                    </p>
                    {companyDetail.ownerEmail ? (
                      <p className="text-sm text-secondary">
                        {t('ownerEmail', { email: companyDetail.ownerEmail })}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-secondary">
                      {t('verificationStatus', {
                        status: tc(`status.${companyDetail.verificationStatus}`),
                      })}
                    </p>
                  </div>
                  <AdminCompanyMetrics
                    reviewCount={companyDetail.reviewCount}
                    pageVisitCount={companyDetail.pageVisitCount}
                    size="md"
                  />
                </div>
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                  {companyDetail.ownerId ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={acting}
                      onClick={() =>
                        void handleToggleCompanyOwnerActive(
                          companyDetail.ownerId!,
                          companyDetail.ownerIsActive ?? true,
                        )
                      }
                    >
                      {companyDetail.ownerIsActive === false
                        ? t('activateOwner')
                        : t('deactivateOwner')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={acting}
                    onClick={() => void handleDeleteCompany(companyDetail.id)}
                  >
                    {t('deleteCompany')}
                  </Button>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-primary">
                    {t('reviewsAndReplies')}
                  </h4>
                  <EntityReviewsList
                    reviews={companyDetail.reviews}
                    acting={acting}
                    onDeleteReview={(id) => void handleDeleteReview(id)}
                    onDeleteReply={(id) => void handleDeleteReply(id)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

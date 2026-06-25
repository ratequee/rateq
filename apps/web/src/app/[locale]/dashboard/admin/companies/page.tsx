'use client';

import { AdminCompanyMetrics } from '@/components/dashboard/admin-company-metrics';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import type {
  AdminCompanyVerificationDetail,
  AdminCompanyVerificationSummary,
  AdminProfileChangeField,
  CompanyVerificationStatus,
  UpdateCompanyVerificationInput,
} from '@rateq/types';
import { cn } from '@/lib/utils';
import { Building2, ExternalLink, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type FilterStatus = CompanyVerificationStatus | 'all' | 'profile_changes';

const PAGE_TITLE = 'Company verifications';
const PAGE_SUBTITLE =
  'Review submitted company profiles, pending profile changes, documents, and approve or reject requests.';

export default function AdminCompanyVerificationsPage() {
  const t = useTranslations('adminCompanies');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as FilterStatus | null) ?? 'pending';
  const [filter, setFilter] = useState<FilterStatus>(initialFilter);

  useEffect(() => {
    const next = (searchParams.get('filter') as FilterStatus | null) ?? 'pending';
    setFilter(next);
  }, [searchParams]);
  const [items, setItems] = useState<AdminCompanyVerificationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminCompanyVerificationDetail | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [profileChangeActing, setProfileChangeActing] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  useRequireAdmin(AdminPermission.COMPANIES);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const response = await adminApi.listCompanyVerifications({
        status: filter === 'all' ? undefined : filter,
        page: 1,
        limit: 50,
      });
      setItems(response.data);
      if (response.data.length === 0) {
        setSelectedId(null);
        setDetail(null);
      } else if (!response.data.some((item) => item.id === selectedId)) {
        const first = response.data[0];
        if (first) setSelectedId(first.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, [filter, selectedId, t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    adminApi
      .getCompanyVerification(selectedId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : t('loadError');
          toast.error(message);
          setDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, t]);

  const handleDecision = async (status: UpdateCompanyVerificationInput['status']) => {
    if (!selectedId) return;

    if (status === 'revision_requested' && revisionNotes.trim().length < 10) {
      toast.error(t('revisionNotesRequired'));
      return;
    }

    setActing(true);
    try {
      const updated = await adminApi.updateCompanyVerification(selectedId, {
        status,
        ...(status === 'revision_requested' ? { revisionNotes: revisionNotes.trim() } : {}),
      });
      setDetail(updated);
      if (status === 'approved') toast.success(t('approvedSuccess'));
      if (status === 'rejected') toast.success(t('rejectedSuccess'));
      if (status === 'revision_requested') {
        toast.success(t('revisionRequestedSuccess'));
        setRevisionOpen(false);
        setRevisionNotes('');
      }
      await loadList();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setActing(false);
    }
  };

  const handleProfileChangeDecision = async (action: 'approve' | 'reject') => {
    if (!selectedId) return;

    setProfileChangeActing(true);
    try {
      if (action === 'approve') {
        await adminApi.approveProfileChanges(selectedId);
        toast.success(t('profileChangeApproved'));
      } else {
        await adminApi.rejectProfileChanges(selectedId);
        toast.success(t('profileChangeRejected'));
      }
      await loadList();
      const refreshed = await adminApi.getCompanyVerification(selectedId);
      setDetail(refreshed);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setProfileChangeActing(false);
    }
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: t('filterPending') },
    { key: 'profile_changes', label: t('filterProfileChanges') },
    { key: 'revision_requested', label: t('filterRevisionRequested') },
    { key: 'approved', label: t('filterApproved') },
    { key: 'rejected', label: t('filterRejected') },
    { key: 'all', label: t('filterAll') },
  ];

  return (
    <DashboardShell role="admin">
      <DashboardPageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'dashboard-tab rounded-full px-4 py-1.5 text-sm font-medium',
              filter === key ? 'dashboard-tab-active' : 'dashboard-tab-inactive',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="surface-card overflow-hidden rounded-2xl border">
          {listLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted">{t('emptyList')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-4 text-start dashboard-list-hover',
                      selectedId === item.id && 'dashboard-list-selected',
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      {item.logo ? (
                        <img src={item.logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-brand-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{item.name}</p>
                          <p className="text-xs text-ink-muted">
                            {item.city}, {item.country}
                          </p>
                        </div>
                        <AdminCompanyMetrics
                          reviewCount={item.reviewCount}
                          pageVisitCount={item.pageVisitCount}
                        />
                      </div>
                      <StatusBadge
                        status={item.verificationStatus}
                        label={t(`status.${item.verificationStatus}`)}
                      />
                      {item.profileChangeStatus === 'pending' ? (
                        <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                          {t('profileChangeBadge')}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card rounded-2xl border p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : !detail ? (
            <p className="py-16 text-center text-sm text-ink-muted">{t('selectCompany')}</p>
          ) : detail.profileChangeStatus === 'pending' ? (
            <ProfileChangeDetailPanel
              detail={detail}
              acting={profileChangeActing}
              onApprove={() => void handleProfileChangeDecision('approve')}
              onReject={() => void handleProfileChangeDecision('reject')}
              t={t}
            />
          ) : (
            <CompanyDetailPanel
              detail={detail}
              acting={acting}
              revisionOpen={revisionOpen}
              revisionNotes={revisionNotes}
              onRevisionNotesChange={setRevisionNotes}
              onOpenRevision={() => setRevisionOpen(true)}
              onCloseRevision={() => setRevisionOpen(false)}
              onApprove={() => void handleDecision('approved')}
              onReject={() => void handleDecision('rejected')}
              onSendRevision={() => void handleDecision('revision_requested')}
              locale={locale}
              t={t}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function StatusBadge({ status, label }: { status: CompanyVerificationStatus; label: string }) {
  return (
    <span
      className={cn(
        'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'pending' &&
          'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
        status === 'revision_requested' &&
          'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
        status === 'approved' &&
          'bg-green-100 text-green-800 dark:bg-emerald-950/50 dark:text-emerald-300',
        status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
      )}
    >
      {label}
    </span>
  );
}

function ProfileChangeDetailPanel({
  detail,
  acting,
  onApprove,
  onReject,
  t,
}: {
  detail: AdminCompanyVerificationDetail;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
  t: ReturnType<typeof useTranslations<'adminCompanies'>>;
}) {
  const fields = detail.profileChangeFields ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white">{detail.name}</h2>
          <p className="text-sm text-ink-muted dark:text-slate-300">
            {detail.city}, {detail.country}
          </p>
          <span className="mt-2 inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            {t('profileChangeBadge')}
          </span>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <AdminCompanyMetrics
            reviewCount={detail.reviewCount}
            pageVisitCount={detail.pageVisitCount}
            size="md"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline-brand" disabled={acting} onClick={onReject}>
              {t('reject')}
            </Button>
            <Button disabled={acting} onClick={onApprove}>
              {acting ? t('acting') : t('approve')}
            </Button>
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-ink dark:text-white">
          {t('profileChangeTitle')}
        </h3>
        <p className="mt-1 text-sm text-ink-muted dark:text-slate-300">
          {t('profileChangeSubtitle')}
        </p>
        {fields.length === 0 ? (
          <p className="mt-4 text-sm text-secondary">{t('profileChangeEmpty')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-subtle">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-start dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 font-semibold text-primary">
                    {t('profileChangeField')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary">
                    {t('profileChangeCurrent')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary">
                    {t('profileChangeProposed')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fields.map((field: AdminProfileChangeField) => (
                  <tr key={field.field}>
                    <td className="px-4 py-3 font-medium text-primary">{field.label}</td>
                    <td className="px-4 py-3 text-secondary">{field.current}</td>
                    <td className="px-4 py-3 font-medium text-ink dark:text-white">
                      {field.proposed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailItem label={t('ownerEmail')} value={detail.owner?.email ?? t('unknownOwner')} />
        <DetailItem
          label={t('submittedAt')}
          value={new Date(detail.updatedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        />
      </dl>
    </div>
  );
}

function CompanyDetailPanel({
  detail,
  acting,
  revisionOpen,
  revisionNotes,
  onRevisionNotesChange,
  onOpenRevision,
  onCloseRevision,
  onApprove,
  onReject,
  onSendRevision,
  locale,
  t,
}: {
  detail: AdminCompanyVerificationDetail;
  acting: boolean;
  revisionOpen: boolean;
  revisionNotes: string;
  onRevisionNotesChange: (value: string) => void;
  onOpenRevision: () => void;
  onCloseRevision: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSendRevision: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations<'adminCompanies'>>;
}) {
  const canDecide = detail.verificationStatus === 'pending';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">{detail.name}</h2>
          <p className="text-sm text-ink-muted">
            {detail.city}, {detail.country}
          </p>
          <StatusBadge
            status={detail.verificationStatus}
            label={t(`status.${detail.verificationStatus}`)}
          />
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <AdminCompanyMetrics
            reviewCount={detail.reviewCount}
            pageVisitCount={detail.pageVisitCount}
            size="md"
          />
          {canDecide && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline-brand" disabled={acting} onClick={onReject}>
                {t('reject')}
              </Button>
              <Button variant="outline" disabled={acting} onClick={onOpenRevision}>
                {t('sendForReview')}
              </Button>
              <Button disabled={acting} onClick={onApprove}>
                {acting ? t('acting') : t('approve')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {detail.revisionNotes && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
          <p className="font-medium">{t('revisionNotesLabel')}</p>
          <p className="mt-2 whitespace-pre-wrap">{detail.revisionNotes}</p>
        </div>
      )}

      {revisionOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <label className="mb-2 block text-sm font-medium text-primary">
            {t('revisionModalLabel')}
          </label>
          <textarea
            value={revisionNotes}
            onChange={(e) => onRevisionNotesChange(e.target.value)}
            rows={5}
            className="textarea-field"
            placeholder={t('revisionModalPlaceholder')}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" disabled={acting} onClick={onCloseRevision}>
              {t('cancelRevision')}
            </Button>
            <Button disabled={acting} onClick={onSendRevision}>
              {acting ? t('acting') : t('sendRevisionEmail')}
            </Button>
          </div>
        </div>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailItem label={t('ownerEmail')} value={detail.owner?.email ?? t('unknownOwner')} />
        <DetailItem label={t('crNumber')} value={detail.crNumber ?? '—'} />
        <DetailItem label={t('address')} value={detail.address ?? '—'} className="sm:col-span-2" />
        <DetailItem
          label={t('validationDate')}
          value={
            detail.validationDate
              ? new Date(detail.validationDate).toLocaleDateString(locale, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'
          }
        />
        <DetailItem
          label={t('submittedAt')}
          value={new Date(detail.createdAt).toLocaleString(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        />
      </dl>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink">{t('documents')}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DocumentCard
            label={t('establishmentCard')}
            url={detail.establishmentCardUrl}
            icon={<FileText className="h-8 w-8 text-brand-500" />}
          />
          <DocumentCard
            label={t('tradeLicense')}
            url={detail.tradeLicenseUrl}
            icon={<FileText className="h-8 w-8 text-brand-500" />}
          />
          <DocumentCard
            label={t('registrationDoc')}
            url={detail.registrationDocUrl}
            icon={<FileText className="h-8 w-8 text-brand-500" />}
          />
          <DocumentCard
            label={t('logo')}
            url={detail.logo}
            icon={<ImageIcon className="h-8 w-8 text-brand-500" />}
            image
          />
          <DocumentCard
            label={t('cover')}
            url={detail.coverUrl}
            icon={<ImageIcon className="h-8 w-8 text-brand-500" />}
            image
          />
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

function DocumentCard({
  label,
  url,
  icon,
  image = false,
}: {
  label: string;
  url: string | null;
  icon: React.ReactNode;
  image?: boolean;
}) {
  const t = useTranslations('adminCompanies');

  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-secondary dark:border-slate-700">
        {label}: {t('notProvided')}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-primary dark:border-slate-800 dark:bg-slate-800/60">
        {label}
      </div>
      {image ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={label} className="h-36 w-full object-cover" />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-6 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800"
        >
          {icon}
          <span className="flex items-center gap-1">
            {t('openDocument')}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>
      )}
    </div>
  );
}

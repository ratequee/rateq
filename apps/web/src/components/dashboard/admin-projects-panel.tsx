'use client';

import { Button } from '@/components/ui/button';
import { ensureValidAccessToken } from '@/lib/auth-session';
import { reviewsApi, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AdminCompanyProjectListItem, PaginatedAdminProjectsResponse } from '@rateq/types';
import { CompanyProjectStatus } from '@rateq/types';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusStyles: Record<CompanyProjectStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

const STATUS_OPTIONS: Array<CompanyProjectStatus | 'all'> = [
  'all',
  CompanyProjectStatus.PENDING,
  CompanyProjectStatus.APPROVED,
  CompanyProjectStatus.REJECTED,
];

export function AdminProjectsPanel() {
  const t = useTranslations('adminProjects');
  const locale = useLocale();
  const [projects, setProjects] = useState<AdminCompanyProjectListItem[]>([]);
  const [meta, setMeta] = useState<PaginatedAdminProjectsResponse['meta'] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<CompanyProjectStatus | 'all'>(CompanyProjectStatus.PENDING);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const selectedProject = projects.find((project) => project.id === selectedId) ?? null;

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (status !== 'all') params.set('status', status);

      const response = await reviewsApi.listAdminProjects(token, params);
      setProjects(response.data);
      setMeta(response.meta);
      setSelectedId((current) =>
        current && response.data.some((item) => item.id === current)
          ? current
          : (response.data[0]?.id ?? null),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, status, t]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const runAction = async (action: () => Promise<void>) => {
    setActing(true);
    try {
      await action();
      await loadProjects();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setActing(false);
    }
  };

  const handleApprove = async (projectId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(async () => {
      await reviewsApi.approveProject(token, projectId);
      toast.success(t('approveSuccess'));
    });
  };

  const handleReject = async (projectId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(async () => {
      await reviewsApi.rejectProject(token, projectId);
      toast.success(t('rejectSuccess'));
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    const token = await ensureValidAccessToken();
    if (!token) return;
    await runAction(async () => {
      await reviewsApi.deleteProject(token, projectId);
      toast.success(t('deleteSuccess'));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              status === option
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-secondary hover:bg-slate-200 dark:bg-dm-elevated dark:hover:bg-dm-surface',
            )}
          >
            {option === 'all' ? t('filters.all') : t(`status.${option}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="overflow-hidden rounded-2xl surface-card border shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-dm-border">
            <h2 className="text-lg font-bold text-primary">{t('tableTitle')}</h2>
            <p className="mt-1 text-sm text-secondary">{t('tableSubtitle')}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-5 py-16 text-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <p className="px-5 py-10 text-sm text-secondary">{t('empty')}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-dm-border">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className={cn(
                    'flex w-full items-start gap-4 px-5 py-4 text-start dashboard-list-hover',
                    selectedId === project.id && 'dashboard-list-selected',
                  )}
                >
                  <img
                    src={project.imageUrl}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-primary">{project.title}</p>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusStyles[project.status],
                        )}
                      >
                        {t(`status.${project.status}`)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-secondary">{project.company.name}</p>
                    <p className="mt-1 text-xs text-secondary">
                      {new Date(project.createdAt).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-dm-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {t('pagination.previous')}
              </Button>
              <span className="text-sm text-secondary">
                {t('pagination.pageOf', { page, total: meta.totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                {t('pagination.next')}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl surface-card border p-5 shadow-sm">
          {!selectedProject ? (
            <p className="text-sm text-secondary">{t('selectProject')}</p>
          ) : (
            <div className="space-y-4">
              <img
                src={selectedProject.imageUrl}
                alt=""
                className="h-44 w-full rounded-xl object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-primary">{selectedProject.title}</h3>
                <p className="mt-1 text-sm text-secondary">{selectedProject.company.name}</p>
                {selectedProject.company.categoryName ? (
                  <p className="mt-1 text-sm text-secondary">
                    {selectedProject.company.categoryName}
                  </p>
                ) : null}
              </div>

              {selectedProject.description ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-secondary">
                  {selectedProject.description}
                </p>
              ) : null}

              {selectedProject.customServices.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-primary">{t('services')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProject.customServices.map((service) => (
                      <span
                        key={service}
                        className="rounded-full border border-default bg-slate-100 px-3 py-1 text-sm text-primary dark:bg-dm-elevated"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedProject.demoImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedProject.demoImages.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt=""
                      className="h-24 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-subtle pt-4">
                {selectedProject.status === CompanyProjectStatus.PENDING ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={acting}
                      onClick={() => void handleApprove(selectedProject.id)}
                    >
                      {t('approve')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={acting}
                      onClick={() => void handleReject(selectedProject.id)}
                    >
                      {t('reject')}
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={acting}
                  onClick={() => void handleDelete(selectedProject.id)}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

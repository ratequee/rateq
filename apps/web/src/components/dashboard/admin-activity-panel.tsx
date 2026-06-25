'use client';

import { adminApi } from '@/lib/admin-platform-api';
import { ApiError } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { AdminActivityLog } from '@rateq/types';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AdminActivityPanel() {
  const t = useTranslations('adminActivity');
  const locale = useLocale();
  const [items, setItems] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;

      const result = await adminApi.listActivity(token, page);
      setItems(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="surface-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-primary">{t('title')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-secondary">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-subtle">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-sm text-primary">
                {t('entry', {
                  admin: item.adminDisplayName ?? item.adminEmail,
                  action: t(`actions.${item.action}`),
                  entity: t(`entities.${item.entityType}`),
                  label: item.entityLabel,
                })}
              </p>
              <p className="mt-1 text-xs text-secondary">
                {new Date(item.createdAt).toLocaleString(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="text-sm text-brand-600 disabled:opacity-50"
          >
            {t('previous')}
          </button>
          <span className="text-xs text-secondary">{t('page', { page, total: totalPages })}</span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="text-sm text-brand-600 disabled:opacity-50"
          >
            {t('next')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

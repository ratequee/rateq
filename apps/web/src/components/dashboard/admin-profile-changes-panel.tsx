'use client';

import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import type { CompanyDetail } from '@rateq/types';
import { Check, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AdminProfileChangesPanel() {
  const t = useTranslations('adminProfileChanges');
  const [items, setItems] = useState<CompanyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await adminApi.listProfileChanges());
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.approveProfileChanges(id);
      toast.success(t('approved'));
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.rejectProfileChanges(id);
      toast.success(t('rejected'));
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('actionError');
      toast.error(message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-subtle surface-card p-6 shadow-sm">
      <div>
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
        <ul className="space-y-3">
          {items.map((company) => (
            <li
              key={company.id}
              className="flex flex-col gap-3 rounded-xl border border-subtle p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-primary">{company.name}</p>
                <p className="text-sm text-secondary">
                  {t('pendingSince', { status: company.profileChangeStatus })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={actingId === company.id}
                  onClick={() => void approve(company.id)}
                  className="gap-1"
                >
                  {actingId === company.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {t('approve')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actingId === company.id}
                  onClick={() => void reject(company.id)}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  {t('reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

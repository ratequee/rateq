'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import type { CompanyCatalogItemPublic, CompanyCatalogType } from '@rateq/types';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AdminCompanyCatalogPanel() {
  const t = useTranslations('adminCatalog');
  const [type, setType] = useState<CompanyCatalogType>('service');
  const [items, setItems] = useState<CompanyCatalogItemPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await adminApi.listCompanyCatalog(type));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      toast.error(t('namesRequired'));
      return;
    }

    setSaving(true);
    try {
      await adminApi.createCompanyCatalogItem({
        type,
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
      });
      setNameEn('');
      setNameAr('');
      await load();
      toast.success(t('created'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCompanyCatalogItem(id);
      await load();
      toast.success(t('deleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('deleteError');
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-subtle surface-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-primary">{t('title')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('subtitle')}</p>
      </div>

      <div className="flex gap-2">
        {(['service', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setType(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              type === tab
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-ink-muted dark:bg-slate-800'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder={t('nameEnPlaceholder')}
          className="h-11"
        />
        <Input
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder={t('nameArPlaceholder')}
          className="h-11"
          dir="rtl"
        />
        <Button type="submit" disabled={saving} className="h-11 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('add')}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-secondary">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-subtle rounded-xl border border-subtle">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">{item.nameEn}</p>
                <p className="text-sm text-secondary" dir="rtl">
                  {item.nameAr}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleDelete(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { adminApi } from '@/lib/admin-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import type { CategoryPublic } from '@rateq/types';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const t = useTranslations('adminCategories');
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useRequireFirebaseAdmin();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategoriesClient();
      setCategories(data);
    } catch {
      toast.error(t('loadError'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error(t('nameTooShort'));
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createCategory({ name: trimmed });
      setName('');
      await loadCategories();
      toast.success(t('created'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('createError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminApi.removeCategory(id);
      await loadCategories();
      toast.success(t('deleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('deleteError');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('subtitle')}</p>
        </div>

        <form
          onSubmit={handleCreate}
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">{t('nameLabel')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="h-11"
            />
          </div>
          <Button type="submit" disabled={submitting} className="gap-2 sm:h-11">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('add')}
          </Button>
        </form>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : categories.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">{t('empty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-ink">{category.name}</p>
                    <p className="text-xs text-ink-muted">
                      {t('companyCount', { count: category.companyCount ?? 0 })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 hover:bg-red-50"
                    disabled={deletingId === category.id}
                    onClick={() => void handleDelete(category.id)}
                  >
                    {deletingId === category.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t('remove')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

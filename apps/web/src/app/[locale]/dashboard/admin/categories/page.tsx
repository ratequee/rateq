'use client';

import { AdminCompanyCatalogPanel } from '@/components/dashboard/admin-company-catalog-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { adminApi } from '@/lib/admin-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import { AdminPermission } from '@rateq/types';
import type { CategoryPublic } from '@rateq/types';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type AdminCatalogTab = 'categories' | 'services' | 'activities';

export default function AdminCategoriesPage() {
  const t = useTranslations('adminCategories');
  const tc = useTranslations('adminCatalog');
  const [activeTab, setActiveTab] = useState<AdminCatalogTab>('categories');
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useRequireAdmin(AdminPermission.CONTENT);

  const tabs: { id: AdminCatalogTab; label: string }[] = [
    { id: 'categories', label: t('tabCategories') },
    { id: 'services', label: tc('service') },
    { id: 'activities', label: tc('activity') },
  ];

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
    if (activeTab === 'categories') void loadCategories();
  }, [activeTab, loadCategories]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEn = nameEn.trim();
    const trimmedAr = nameAr.trim();
    if (trimmedEn.length < 2 || trimmedAr.length < 2) {
      toast.error(t('namesRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createCategory({ nameEn: trimmedEn, nameAr: trimmedAr });
      setNameEn('');
      setNameAr('');
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
          <h1 className="text-2xl font-bold text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-secondary">{t('mergedSubtitle')}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-secondary hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'categories' ? (
          <div className="surface-card p-6">
            <form onSubmit={handleCreate} className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
              <Button type="submit" disabled={submitting} className="h-11 gap-2">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t('add')}
              </Button>
            </form>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-secondary">{t('empty')}</p>
            ) : (
              <ul className="divide-y divide-subtle rounded-xl border border-subtle">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary">{category.nameEn}</p>
                      <p className="text-sm text-secondary" dir="rtl">
                        {category.nameAr}
                      </p>
                      <p className="text-xs text-secondary">
                        {t('companyCount', { count: category.companyCount ?? 0 })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === category.id}
                      onClick={() => void handleDelete(category.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingId === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="surface-card p-6">
            <AdminCompanyCatalogPanel
              fixedType={activeTab === 'services' ? 'service' : 'activity'}
              hideTypeTabs
              hideHeader
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

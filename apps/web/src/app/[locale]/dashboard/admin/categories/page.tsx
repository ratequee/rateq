'use client';

import { AdminCompanyCatalogPanel } from '@/components/dashboard/admin-company-catalog-panel';
import { CategoryIconUpload } from '@/components/categories/category-icon-upload';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { adminApi } from '@/lib/admin-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import { AdminPermission } from '@rateq/types';
import type { CategoryPublic, CompanyCatalogType } from '@rateq/types';
import { cn } from '@/lib/utils';
import { Loader2, Pencil, Plus, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [iconUrl, setIconUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [catalogCounts, setCatalogCounts] = useState<Partial<Record<CompanyCatalogType, number>>>(
    {},
  );

  useRequireAdmin(AdminPermission.CONTENT);

  const tabs: { id: AdminCatalogTab; label: string; count?: number }[] = [
    { id: 'categories', label: t('tabCategories'), count: loading ? undefined : categories.length },
    { id: 'services', label: tc('service'), count: catalogCounts.service },
    { id: 'activities', label: tc('activity'), count: catalogCounts.activity },
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

  useEffect(() => {
    void Promise.all([
      adminApi.listCompanyCatalog('service'),
      adminApi.listCompanyCatalog('activity'),
    ]).then(([services, activities]) =>
      setCatalogCounts({ service: services.length, activity: activities.length }),
    );
  }, []);

  const handleCatalogCountChange = useCallback((type: CompanyCatalogType, count: number) => {
    setCatalogCounts((current) => ({ ...current, [type]: count }));
  }, []);

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex((item) => item.id === categoryId);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;

    const current = categories[index]!;
    const neighbor = categories[swapIndex]!;
    const currentOrder = current.sortOrder ?? index;
    const neighborOrder = neighbor.sortOrder ?? swapIndex;

    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...neighbor, sortOrder: currentOrder };
      next[swapIndex] = { ...current, sortOrder: neighborOrder };
      return next;
    });

    try {
      await Promise.all([
        adminApi.updateCategory(current.id, { sortOrder: neighborOrder }),
        adminApi.updateCategory(neighbor.id, { sortOrder: currentOrder }),
      ]);
      toast.success(t('orderUpdated'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('orderError'));
      await loadCategories();
    }
  };

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
      await adminApi.createCategory({
        nameEn: trimmedEn,
        nameAr: trimmedAr,
        iconUrl: iconUrl.trim() || null,
      });
      setNameEn('');
      setNameAr('');
      setIconUrl('');
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
      if (editingId === id) setEditingId(null);
      await loadCategories();
      toast.success(t('deleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('deleteError');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (category: CategoryPublic) => {
    setEditingId(category.id);
    setEditNameEn(category.nameEn);
    setEditNameAr(category.nameAr);
    setEditIconUrl(category.iconUrl ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNameEn('');
    setEditNameAr('');
    setEditIconUrl('');
  };

  const handleUpdate = async (id: string) => {
    if (!editNameEn.trim() || !editNameAr.trim()) {
      toast.error(t('namesRequired'));
      return;
    }

    setEditSaving(true);
    try {
      await adminApi.updateCategory(id, {
        nameEn: editNameEn.trim(),
        nameAr: editNameAr.trim(),
        iconUrl: editIconUrl.trim() || null,
      });
      cancelEdit();
      await loadCategories();
      toast.success(t('updated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('createError');
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  const iconUploadLabels = {
    upload: t('iconUpload'),
    remove: t('iconRemove'),
    hint: t('iconHint'),
    uploadError: t('iconUploadError'),
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
                'dashboard-tab rounded-full px-4 py-2 text-sm font-medium',
                activeTab === tab.id ? 'dashboard-tab-active' : 'dashboard-tab-inactive',
              )}
            >
              {tab.label} <span aria-hidden>({tab.count ?? '—'})</span>
            </button>
          ))}
        </div>

        {activeTab === 'categories' ? (
          <div className="surface-card p-6">
            <form onSubmit={handleCreate} className="mb-6 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary">
                    {t('nameEnLabel')}
                  </label>
                  <Input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder={t('nameEnPlaceholder')}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary">
                    {t('nameArLabel')}
                  </label>
                  <Input
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder={t('nameArPlaceholder')}
                    className="h-11"
                    dir="rtl"
                  />
                </div>
              </div>
              <CategoryIconUpload value={iconUrl} onChange={setIconUrl} labels={iconUploadLabels} />
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
                  <li key={category.id} className="px-4 py-3">
                    {editingId === category.id ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-primary">
                              {t('nameEnLabel')}
                            </label>
                            <Input
                              value={editNameEn}
                              onChange={(e) => setEditNameEn(e.target.value)}
                              placeholder={t('nameEnPlaceholder')}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-primary">
                              {t('nameArLabel')}
                            </label>
                            <Input
                              value={editNameAr}
                              onChange={(e) => setEditNameAr(e.target.value)}
                              placeholder={t('nameArPlaceholder')}
                              className="h-10"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        <CategoryIconUpload
                          value={editIconUrl}
                          onChange={setEditIconUrl}
                          labels={iconUploadLabels}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={editSaving}
                            onClick={() => void handleUpdate(category.id)}
                          >
                            {editSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t('saveEdit')
                            )}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {category.iconUrl ? (
                              <img
                                src={category.iconUrl}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-lg object-contain"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-primary">{category.nameEn}</p>
                              <p className="text-sm text-secondary" dir="rtl">
                                {category.nameAr}
                              </p>
                              <p className="text-xs text-secondary">
                                {t('companyCount', { count: category.companyCount ?? 0 })}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={categories[0]?.id === category.id}
                              onClick={() => void handleMoveCategory(category.id, 'up')}
                              aria-label={t('moveUp')}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={categories[categories.length - 1]?.id === category.id}
                              onClick={() => void handleMoveCategory(category.id, 'down')}
                              aria-label={t('moveDown')}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(category)}
                              aria-label={t('edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === category.id}
                              onClick={() => void handleDelete(category.id)}
                              className="text-red-600 hover:text-red-700"
                              aria-label={t('remove')}
                            >
                              {deletingId === category.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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
              onCountChange={handleCatalogCountChange}
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

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
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
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
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [subNameEn, setSubNameEn] = useState('');
  const [subNameAr, setSubNameAr] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subDeletingId, setSubDeletingId] = useState<string | null>(null);

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

  const handleAddSubcategory = async (categoryId: string) => {
    if (!subNameEn.trim() || !subNameAr.trim()) {
      toast.error(t('namesRequired'));
      return;
    }

    setSubSubmitting(true);
    try {
      await adminApi.addSubcategory(categoryId, {
        nameEn: subNameEn.trim(),
        nameAr: subNameAr.trim(),
      });
      setSubNameEn('');
      setSubNameAr('');
      await loadCategories();
      toast.success(t('subcategoryCreated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('subcategoryCreateError');
      toast.error(message);
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleRemoveSubcategory = async (categoryId: string, subcategoryId: string) => {
    setSubDeletingId(subcategoryId);
    try {
      await adminApi.removeSubcategory(categoryId, subcategoryId);
      await loadCategories();
      toast.success(t('subcategoryDeleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('subcategoryDeleteError');
      toast.error(message);
    } finally {
      setSubDeletingId(null);
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
                'dashboard-tab rounded-full px-4 py-2 text-sm font-medium',
                activeTab === tab.id ? 'dashboard-tab-active' : 'dashboard-tab-inactive',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'categories' ? (
          <div className="surface-card p-6">
            <form onSubmit={handleCreate} className="mb-6 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
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
              </div>
              <div className="flex flex-wrap gap-3">
                <Input
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder={t('iconUrlPlaceholder')}
                  className="h-11 min-w-[240px] flex-1"
                />
                <Button type="submit" disabled={submitting} className="h-11 gap-2">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t('add')}
                </Button>
              </div>
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
                          <Input
                            value={editNameEn}
                            onChange={(e) => setEditNameEn(e.target.value)}
                            className="h-10"
                          />
                          <Input
                            value={editNameAr}
                            onChange={(e) => setEditNameAr(e.target.value)}
                            className="h-10"
                            dir="rtl"
                          />
                        </div>
                        <Input
                          value={editIconUrl}
                          onChange={(e) => setEditIconUrl(e.target.value)}
                          placeholder={t('iconUrlPlaceholder')}
                          className="h-10"
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
                              onClick={() =>
                                setExpandedCategoryId((current) =>
                                  current === category.id ? null : category.id,
                                )
                              }
                            >
                              {expandedCategoryId === category.id
                                ? t('collapseSubcategories')
                                : t('manageSubcategories')}
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
                        {expandedCategoryId === category.id ? (
                          <div className="mt-4 rounded-xl border border-subtle bg-slate-50 p-4 dark:bg-dm-elevated">
                            <p className="text-sm font-medium text-primary">
                              {t('subcategoriesTitle')}
                            </p>
                            {(category.subcategories ?? []).length > 0 ? (
                              <ul className="mt-3 space-y-2">
                                {(category.subcategories ?? []).map((subcategory) => (
                                  <li
                                    key={subcategory.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-subtle bg-white px-3 py-2 dark:bg-dm-surface"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-primary">
                                        {subcategory.nameEn}
                                      </p>
                                      <p className="text-sm text-secondary" dir="rtl">
                                        {subcategory.nameAr}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={subDeletingId === subcategory.id}
                                      onClick={() =>
                                        void handleRemoveSubcategory(category.id, subcategory.id)
                                      }
                                      className="text-red-600"
                                    >
                                      {subDeletingId === subcategory.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm text-secondary">{t('noSubcategories')}</p>
                            )}
                            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <Input
                                value={subNameEn}
                                onChange={(e) => setSubNameEn(e.target.value)}
                                placeholder={t('subNameEnPlaceholder')}
                                className="h-10"
                              />
                              <Input
                                value={subNameAr}
                                onChange={(e) => setSubNameAr(e.target.value)}
                                placeholder={t('subNameArPlaceholder')}
                                className="h-10"
                                dir="rtl"
                              />
                              <Button
                                type="button"
                                size="sm"
                                disabled={subSubmitting}
                                onClick={() => void handleAddSubcategory(category.id)}
                              >
                                {subSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  t('addSubcategory')
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : null}
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
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

'use client';

import { AdminCompanyCatalogPanel } from '@/components/dashboard/admin-company-catalog-panel';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { adminApi } from '@/lib/admin-api';
import { fetchCategoriesClient } from '@/lib/categories-api';
import { ApiError } from '@/lib/api';
import type { CategoryPublic, CategoryServicePublic } from '@rateq/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serviceNames, setServiceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serviceSubmittingId, setServiceSubmittingId] = useState<string | null>(null);
  const [serviceDeletingKey, setServiceDeletingKey] = useState<string | null>(null);

  useRequireFirebaseAdmin();

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
      if (expandedId === id) setExpandedId(null);
      await loadCategories();
      toast.success(t('deleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('deleteError');
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddService = async (categoryId: string) => {
    const trimmed = (serviceNames[categoryId] ?? '').trim();
    if (trimmed.length < 2) {
      toast.error(t('serviceNameTooShort'));
      return;
    }

    setServiceSubmittingId(categoryId);
    try {
      await adminApi.addCategoryService(categoryId, { name: trimmed });
      setServiceNames((current) => ({ ...current, [categoryId]: '' }));
      await loadCategories();
      toast.success(t('serviceCreated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('serviceCreateError');
      toast.error(message);
    } finally {
      setServiceSubmittingId(null);
    }
  };

  const handleRemoveService = async (categoryId: string, service: CategoryServicePublic) => {
    const key = `${categoryId}:${service.id}`;
    setServiceDeletingKey(key);
    try {
      await adminApi.removeCategoryService(categoryId, service.id);
      await loadCategories();
      toast.success(t('serviceDeleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('serviceDeleteError');
      toast.error(message);
    } finally {
      setServiceDeletingKey(null);
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
          <>
            <form
              onSubmit={handleCreate}
              className="mb-8 grid gap-3 surface-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
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
              <Button type="submit" disabled={submitting} className="gap-2 sm:h-11">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t('add')}
              </Button>
            </form>

            <div className="surface-card">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('loading')}
                </div>
              ) : categories.length === 0 ? (
                <p className="p-10 text-center text-sm text-secondary">{t('empty')}</p>
              ) : (
                <ul className="divide-y divide-subtle">
                  {categories.map((category) => {
                    const expanded = expandedId === category.id;
                    const services = category.services ?? [];

                    return (
                      <li key={category.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-primary">{category.nameEn}</p>
                            <p className="text-sm text-secondary" dir="rtl">
                              {category.nameAr}
                            </p>
                            <p className="text-xs text-secondary">
                              {t('companyCount', { count: category.companyCount ?? 0 })}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => setExpandedId(expanded ? null : category.id)}
                            >
                              {expanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              {expanded ? t('collapseCategory') : t('expandCategory')}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-4 rounded-xl border border-default surface-muted p-4">
                            <p className="text-sm font-medium text-primary">{t('servicesTitle')}</p>
                            <p className="mt-1 text-xs text-secondary">{t('servicesHint')}</p>

                            {services.length === 0 ? (
                              <p className="mt-3 text-sm text-secondary">{t('noServices')}</p>
                            ) : (
                              <ul className="mt-3 space-y-2">
                                {services.map((service) => (
                                  <li
                                    key={service.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-default surface-card px-3 py-2"
                                  >
                                    <span className="text-sm text-primary">{service.name}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                      disabled={
                                        serviceDeletingKey === `${category.id}:${service.id}`
                                      }
                                      onClick={() => void handleRemoveService(category.id, service)}
                                    >
                                      {serviceDeletingKey === `${category.id}:${service.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        t('removeService')
                                      )}
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                              <div className="flex-1">
                                <label className="mb-1.5 block text-xs font-medium text-primary">
                                  {t('serviceNameLabel')}
                                </label>
                                <Input
                                  value={serviceNames[category.id] ?? ''}
                                  onChange={(e) =>
                                    setServiceNames((current) => ({
                                      ...current,
                                      [category.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={t('serviceNamePlaceholder')}
                                  className="h-10"
                                />
                              </div>
                              <Button
                                type="button"
                                disabled={serviceSubmittingId === category.id}
                                onClick={() => void handleAddService(category.id)}
                              >
                                {serviceSubmittingId === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  t('addService')
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
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

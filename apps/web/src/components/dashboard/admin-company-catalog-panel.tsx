'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CompanyCatalogItemPublic, CompanyCatalogType } from '@rateq/types';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdminCompanyCatalogPanelProps {
  fixedType?: CompanyCatalogType;
  hideTypeTabs?: boolean;
  hideHeader?: boolean;
}

export function AdminCompanyCatalogPanel({
  fixedType,
  hideTypeTabs = false,
  hideHeader = false,
}: AdminCompanyCatalogPanelProps = {}) {
  const t = useTranslations('adminCatalog');
  const [type, setType] = useState<CompanyCatalogType>(fixedType ?? 'service');
  const [items, setItems] = useState<CompanyCatalogItemPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (fixedType) setType(fixedType);
  }, [fixedType]);

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

  const startEdit = (item: CompanyCatalogItemPublic) => {
    setEditingId(item.id);
    setEditNameEn(item.nameEn);
    setEditNameAr(item.nameAr);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNameEn('');
    setEditNameAr('');
  };

  const handleUpdate = async (id: string) => {
    if (!editNameEn.trim() || !editNameAr.trim()) {
      toast.error(t('namesRequired'));
      return;
    }

    setEditSaving(true);
    try {
      await adminApi.updateCompanyCatalogItem(id, {
        nameEn: editNameEn.trim(),
        nameAr: editNameAr.trim(),
      });
      cancelEdit();
      await load();
      toast.success(t('updated'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCompanyCatalogItem(id);
      if (editingId === id) cancelEdit();
      await load();
      toast.success(t('deleted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('deleteError');
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {!hideHeader ? (
        <div>
          <h2 className="text-lg font-semibold text-primary">{t('title')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('subtitle')}</p>
        </div>
      ) : null}

      {!hideTypeTabs ? (
        <div className="flex gap-2">
          {(['service', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setType(tab)}
              className={cn(
                'dashboard-tab rounded-full px-4 py-2 text-sm font-medium',
                type === tab ? 'dashboard-tab-active' : 'dashboard-tab-inactive',
              )}
            >
              {t(tab)}
            </button>
          ))}
        </div>
      ) : null}

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
            <li key={item.id} className="px-4 py-3">
              {editingId === item.id ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
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
                  <Button
                    type="button"
                    size="sm"
                    disabled={editSaving}
                    onClick={() => void handleUpdate(item.id)}
                  >
                    {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('saveEdit')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary">{item.nameEn}</p>
                    <p className="text-sm text-secondary" dir="rtl">
                      {item.nameAr}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                      aria-label={t('edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

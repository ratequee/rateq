'use client';

import type { CategoryPublic } from '@rateq/types';
import { getCategoryLabel } from '@/lib/category-label';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface CategorySubcategoryPickerProps {
  label: string;
  hint?: string;
  categories: CategoryPublic[];
  selectedCategoryIds: string[];
  selectedSubcategoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  onSubcategoryChange: (ids: string[]) => void;
  maxCategories?: number;
  categoryError?: string;
  subcategoryError?: string;
}

export function CategorySubcategoryPicker({
  label,
  hint,
  categories,
  selectedCategoryIds,
  selectedSubcategoryIds,
  onCategoryChange,
  onSubcategoryChange,
  maxCategories = 10,
  categoryError,
  subcategoryError,
}: CategorySubcategoryPickerProps) {
  const locale = useLocale();
  const t = useTranslations('profile');

  const toggleCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      const nextCategoryIds = selectedCategoryIds.filter((item) => item !== id);
      const category = categories.find((item) => item.id === id);
      const subcategoryIdsToRemove = new Set(
        (category?.subcategories ?? []).map((item) => item.id),
      );
      onCategoryChange(nextCategoryIds);
      onSubcategoryChange(
        selectedSubcategoryIds.filter((item) => !subcategoryIdsToRemove.has(item)),
      );
      return;
    }

    if (selectedCategoryIds.length >= maxCategories) return;
    onCategoryChange([...selectedCategoryIds, id]);
  };

  const toggleSubcategory = (id: string) => {
    if (selectedSubcategoryIds.includes(id)) {
      onSubcategoryChange(selectedSubcategoryIds.filter((item) => item !== id));
      return;
    }
    onSubcategoryChange([...selectedSubcategoryIds, id]);
  };

  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-secondary">{hint}</p> : null}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-secondary">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const selected = selectedCategoryIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-start text-sm transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-default bg-white text-primary hover:border-brand-300 dark:bg-dm-surface',
                )}
              >
                <span className="block font-medium leading-snug">
                  {getCategoryLabel(category, locale)}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-xs leading-snug',
                    selected ? 'text-white/85' : 'text-secondary',
                  )}
                  dir="rtl"
                >
                  {category.nameAr}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {categoryError ? <p className="mt-1.5 text-sm text-red-600">{categoryError}</p> : null}

      {selectedCategories.length > 0 ? (
        <div className="mt-5 space-y-4">
          {selectedCategories.map((category) => {
            const subcategories = category.subcategories ?? [];
            if (subcategories.length === 0) return null;

            const selectedCount = subcategories.filter((item) =>
              selectedSubcategoryIds.includes(item.id),
            ).length;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-subtle bg-slate-50/80 p-4 dark:bg-dm-elevated"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    {getCategoryLabel(category, locale)}
                  </p>
                  <span className="text-xs text-secondary">
                    {selectedCount > 0
                      ? t('subcategorySelectedCount', { count: selectedCount })
                      : t('subcategoryRequiredSelection')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map((subcategory) => {
                    const selected = selectedSubcategoryIds.includes(subcategory.id);
                    return (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => toggleSubcategory(subcategory.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-start text-sm transition-colors',
                          selected
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-default bg-white text-primary hover:border-brand-300 dark:bg-dm-surface',
                        )}
                      >
                        <span className="block font-medium leading-snug">
                          {locale === 'ar' ? subcategory.nameAr : subcategory.nameEn}
                        </span>
                        <span
                          className={cn(
                            'mt-0.5 block text-xs leading-snug',
                            selected ? 'text-white/85' : 'text-secondary',
                          )}
                          dir="rtl"
                        >
                          {subcategory.nameAr}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {subcategoryError ? <p className="mt-1.5 text-sm text-red-600">{subcategoryError}</p> : null}
    </div>
  );
}

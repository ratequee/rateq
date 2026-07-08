'use client';

import type { CategoryPublic } from '@rateq/types';
import { useMemo } from 'react';
import { getCategoryLabel } from '@/lib/category-label';
import { SearchableChipSelect, type ChipOption } from '@/components/profile/searchable-chip-select';
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
  const t = useTranslations('profilePage');

  const categoryOptions = useMemo<ChipOption[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        primary: getCategoryLabel(category, locale),
        secondary: locale === 'ar' ? null : category.nameAr,
      })),
    [categories, locale],
  );

  const handleCategoryChange = (nextCategoryIds: string[]) => {
    const allowedSubcategoryIds = new Set(
      categories
        .filter((category) => nextCategoryIds.includes(category.id))
        .flatMap((category) => (category.subcategories ?? []).map((sub) => sub.id)),
    );
    onCategoryChange(nextCategoryIds);
    onSubcategoryChange(selectedSubcategoryIds.filter((id) => allowedSubcategoryIds.has(id)));
  };

  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );

  const handleSubcategoryChangeForCategory = (
    category: CategoryPublic,
    nextIdsForCategory: string[],
  ) => {
    const categorySubIds = new Set((category.subcategories ?? []).map((sub) => sub.id));
    const others = selectedSubcategoryIds.filter((id) => !categorySubIds.has(id));
    onSubcategoryChange([...others, ...nextIdsForCategory]);
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-secondary">{hint}</p> : null}
      </div>

      <SearchableChipSelect
        options={categoryOptions}
        selectedIds={selectedCategoryIds}
        onChange={handleCategoryChange}
        maxItems={maxCategories}
      />
      {categoryError ? <p className="mt-1.5 text-sm text-red-600">{categoryError}</p> : null}

      {selectedCategories.length > 0 ? (
        <div className="mt-5 space-y-4">
          {selectedCategories.map((category) => {
            const subcategories = category.subcategories ?? [];
            if (subcategories.length === 0) return null;

            const subOptions: ChipOption[] = subcategories.map((sub) => ({
              id: sub.id,
              primary: locale === 'ar' ? sub.nameAr : sub.nameEn,
              secondary: locale === 'ar' ? null : sub.nameAr,
            }));
            const selectedIdsForCategory = subcategories
              .filter((sub) => selectedSubcategoryIds.includes(sub.id))
              .map((sub) => sub.id);
            const selectedCount = selectedIdsForCategory.length;

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
                <SearchableChipSelect
                  options={subOptions}
                  selectedIds={selectedIdsForCategory}
                  onChange={(next) => handleSubcategoryChangeForCategory(category, next)}
                  maxItems={subcategories.length}
                  showHeader={false}
                />
              </div>
            );
          })}
        </div>
      ) : null}
      {subcategoryError ? <p className="mt-1.5 text-sm text-red-600">{subcategoryError}</p> : null}
    </div>
  );
}

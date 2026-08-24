'use client';

import type { CategoryPublic } from '@rateq/types';
import { useMemo } from 'react';
import { getCategoryLabel } from '@/lib/category-label';
import { SearchableChipSelect, type ChipOption } from '@/components/profile/searchable-chip-select';
import { useLocale } from 'next-intl';

interface CategorySubcategoryPickerProps {
  label: string;
  hint?: string;
  categories: CategoryPublic[];
  selectedCategoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  maxCategories?: number;
  categoryError?: string;
}

export function CategorySubcategoryPicker({
  label,
  hint,
  categories,
  selectedCategoryIds,
  onCategoryChange,
  maxCategories = 10,
  categoryError,
}: CategorySubcategoryPickerProps) {
  const locale = useLocale();

  const categoryOptions = useMemo<ChipOption[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        primary: getCategoryLabel(category, locale),
        secondary: locale === 'ar' ? null : category.nameAr,
      })),
    [categories, locale],
  );

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-secondary">{hint}</p> : null}
      </div>

      <SearchableChipSelect
        options={categoryOptions}
        selectedIds={selectedCategoryIds}
        onChange={onCategoryChange}
        maxItems={maxCategories}
      />
      {categoryError ? <p className="mt-1.5 text-sm text-red-600">{categoryError}</p> : null}
    </div>
  );
}

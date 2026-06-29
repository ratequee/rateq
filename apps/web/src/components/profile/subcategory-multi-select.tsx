'use client';

import type { CategoryPublic } from '@rateq/types';
import { getCategoryLabel } from '@/lib/category-label';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface SubcategoryMultiSelectProps {
  label: string;
  hint?: string;
  categories: CategoryPublic[];
  selectedCategoryIds: string[];
  selectedSubcategoryIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

export function SubcategoryMultiSelect({
  label,
  hint,
  categories,
  selectedCategoryIds,
  selectedSubcategoryIds,
  onChange,
  error,
}: SubcategoryMultiSelectProps) {
  const locale = useLocale();

  const relevantCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );

  const toggle = (id: string) => {
    if (selectedSubcategoryIds.includes(id)) {
      onChange(selectedSubcategoryIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedSubcategoryIds, id]);
  };

  if (selectedCategoryIds.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-secondary">{hint}</p> : null}
      </div>
      <div className="space-y-4">
        {relevantCategories.map((category) => {
          const subcategories = category.subcategories ?? [];
          if (subcategories.length === 0) return null;

          return (
            <div key={category.id}>
              <p className="mb-2 text-sm font-semibold text-primary">
                {getCategoryLabel(category, locale)}
              </p>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((subcategory) => {
                  const selected = selectedSubcategoryIds.includes(subcategory.id);
                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => toggle(subcategory.id)}
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
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

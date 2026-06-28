'use client';

import type { CategoryPublic } from '@rateq/types';
import { getCategoryLabel } from '@/lib/category-label';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface CategoryMultiSelectProps {
  label: string;
  hint?: string;
  categories: CategoryPublic[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxItems?: number;
  error?: string;
}

export function CategoryMultiSelect({
  label,
  hint,
  categories,
  selectedIds,
  onChange,
  maxItems = 10,
  error,
}: CategoryMultiSelectProps) {
  const locale = useLocale();

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= maxItems) return;
    onChange([...selectedIds, id]);
  };

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
            const selected = selectedIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggle(category.id)}
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
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

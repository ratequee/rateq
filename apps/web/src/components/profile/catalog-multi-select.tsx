'use client';

import type { CompanyCatalogItemPublic } from '@rateq/types';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface CatalogMultiSelectProps {
  label: string;
  hint?: string;
  items: CompanyCatalogItemPublic[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxItems?: number;
}

export function CatalogMultiSelect({
  label,
  hint,
  items,
  selectedIds,
  onChange,
  maxItems = 30,
}: CatalogMultiSelectProps) {
  const locale = useLocale();
  const isArabic = locale === 'ar';

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= maxItems) return;
    onChange([...selectedIds, id]);
  };

  const activeItems = items.filter((item) => item.isActive);

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
      </div>
      {activeItems.length === 0 ? (
        <p className="text-sm text-ink-muted">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            const displayLabel = isArabic ? item.nameAr : item.nameEn;
            const altLabel = isArabic ? item.nameEn : item.nameAr;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                title={altLabel}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-slate-200 bg-white text-ink hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900',
                )}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

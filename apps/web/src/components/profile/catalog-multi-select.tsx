'use client';

import type { CompanyCatalogItemPublic } from '@rateq/types';
import { cn } from '@/lib/utils';

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
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-secondary">{hint}</p> : null}
      </div>
      {activeItems.length === 0 ? (
        <p className="text-sm text-secondary">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-start text-sm transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-default bg-white text-primary hover:border-brand-300 dark:bg-slate-900',
                )}
              >
                <span className="block font-medium leading-snug">{item.nameEn}</span>
                <span
                  className={cn(
                    'mt-0.5 block text-xs leading-snug',
                    selected ? 'text-white/85' : 'text-secondary',
                  )}
                  dir="rtl"
                >
                  {item.nameAr}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

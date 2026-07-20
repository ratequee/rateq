'use client';

import type { CompanyCatalogItemPublic } from '@rateq/types';
import { useMemo } from 'react';
import { SearchableChipSelect, type ChipOption } from '@/components/profile/searchable-chip-select';

interface CatalogMultiSelectProps {
  label: string;
  hint?: string;
  notice?: string;
  items: CompanyCatalogItemPublic[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxItems?: number;
}

export function CatalogMultiSelect({
  label,
  hint,
  notice,
  items,
  selectedIds,
  onChange,
  maxItems = 30,
}: CatalogMultiSelectProps) {
  const options = useMemo<ChipOption[]>(
    () =>
      items
        .filter((item) => item.isActive)
        .map((item) => ({ id: item.id, primary: item.nameEn, secondary: item.nameAr })),
    [items],
  );

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-primary">{label}</p>
        {hint ? <p className="text-xs text-secondary">{hint}</p> : null}
      </div>
      {notice ? (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          {notice}
        </p>
      ) : null}
      <SearchableChipSelect
        options={options}
        selectedIds={selectedIds}
        onChange={onChange}
        maxItems={maxItems}
      />
    </div>
  );
}

'use client';

import type { CompanyCatalogItemPublic } from '@rateq/types';
import { useMemo } from 'react';
import { SearchableChipSelect, type ChipOption } from '@/components/profile/searchable-chip-select';

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
      <SearchableChipSelect
        options={options}
        selectedIds={selectedIds}
        onChange={onChange}
        maxItems={maxItems}
      />
    </div>
  );
}

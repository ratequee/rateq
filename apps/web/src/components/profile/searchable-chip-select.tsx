'use client';

import { Check, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface ChipOption {
  id: string;
  primary: string;
  secondary?: string | null;
}

interface SearchableChipSelectProps {
  options: ChipOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxItems?: number;
  /** Collapse the options list to a scrollable box once this many options exist. */
  collapseThreshold?: number;
  emptyLabel?: string;
  /** Show the selected count + clear-all header row. */
  showHeader?: boolean;
}

export function SearchableChipSelect({
  options,
  selectedIds,
  onChange,
  maxItems = 30,
  collapseThreshold = 8,
  emptyLabel,
  showHeader = true,
}: SearchableChipSelectProps) {
  const t = useTranslations('profile');
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(option.id)),
    [options, selectedSet],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => {
      const haystack = `${option.primary} ${option.secondary ?? ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= maxItems) return;
    onChange([...selectedIds, id]);
  };

  const limitReached = selectedIds.length >= maxItems;
  const shouldScroll = options.length > collapseThreshold;

  if (options.length === 0) {
    return <p className="text-sm text-secondary">{emptyLabel ?? '—'}</p>;
  }

  return (
    <div className="space-y-3">
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-secondary">
            {t('multiSelectSelectedCount', { count: selectedIds.length, max: maxItems })}
          </span>
          {selectedIds.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              {t('multiSelectClearAll')}
            </button>
          ) : null}
        </div>
      ) : null}

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 py-1 pe-1.5 ps-3 text-sm font-medium text-white"
            >
              {option.primary}
              <button
                type="button"
                onClick={() => toggle(option.id)}
                aria-label={t('multiSelectRemove', { item: option.primary })}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/35"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {shouldScroll ? (
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('multiSelectSearch')}
            className="h-10 w-full rounded-lg border border-default bg-white ps-9 pe-3 text-sm text-primary outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-dm-surface"
          />
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-wrap gap-2',
          shouldScroll &&
            'max-h-64 overflow-y-auto rounded-xl border border-subtle bg-slate-50/60 p-3 dark:bg-dm-elevated/40',
        )}
      >
        {filteredOptions.length === 0 ? (
          <p className="w-full py-4 text-center text-sm text-secondary">
            {t('multiSelectNoResults')}
          </p>
        ) : (
          filteredOptions.map((option) => {
            const selected = selectedSet.has(option.id);
            const disabled = !selected && limitReached;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-default bg-white text-primary hover:border-brand-300 dark:bg-dm-surface',
                  disabled && 'cursor-not-allowed opacity-50 hover:border-default',
                )}
              >
                {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                <span className="leading-snug">
                  <span className="block font-medium">{option.primary}</span>
                  {option.secondary ? (
                    <span
                      className={cn(
                        'mt-0.5 block text-xs leading-snug',
                        selected ? 'text-white/85' : 'text-secondary',
                      )}
                      dir="rtl"
                    >
                      {option.secondary}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

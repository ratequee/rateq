'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LegalDocumentPoint } from '@rateq/types';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

function createPoint(sortOrder: number): LegalDocumentPoint {
  return {
    id: `point-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    sortOrder,
  };
}

interface LegalPointsEditorProps {
  label: string;
  points: LegalDocumentPoint[];
  onChange: (points: LegalDocumentPoint[]) => void;
  dir?: 'ltr' | 'rtl';
}

export function LegalPointsEditor({ label, points, onChange, dir }: LegalPointsEditorProps) {
  const t = useTranslations('adminSettings');
  const ordered = [...points].sort((a, b) => a.sortOrder - b.sortOrder);

  const updateAt = (index: number, patch: Partial<LegalDocumentPoint>) => {
    onChange(ordered.map((point, i) => (i === index ? { ...point, ...patch } : point)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next.map((point, i) => ({ ...point, sortOrder: i })));
  };

  const remove = (index: number) => {
    onChange(ordered.filter((_, i) => i !== index).map((point, i) => ({ ...point, sortOrder: i })));
  };

  const add = () => {
    onChange([...ordered, createPoint(ordered.length)]);
  };

  return (
    <div className="space-y-3" dir={dir}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary">{label}</h3>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="me-1.5 h-4 w-4" />
          {t('legalAddPoint')}
        </Button>
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-subtle px-4 py-6 text-center text-sm text-secondary">
          {t('legalEmpty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {ordered.map((point, index) => (
            <li
              key={point.id}
              className="space-y-3 rounded-xl border border-subtle bg-slate-50/70 p-4 dark:bg-dm-elevated"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gold-600 dark:text-gold-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={t('legalMoveUp')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === ordered.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={t('legalMoveDown')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                    aria-label={t('legalRemovePoint')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary">
                  {t('legalPointTitle')}
                </label>
                <Input
                  value={point.title}
                  onChange={(e) => updateAt(index, { title: e.target.value })}
                  className="h-10"
                  placeholder={t('legalPointTitlePlaceholder')}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary">
                  {t('legalPointDescription')}
                </label>
                <textarea
                  value={point.description}
                  onChange={(e) => updateAt(index, { description: e.target.value })}
                  rows={4}
                  className="select-field w-full py-2 text-sm"
                  placeholder={t('legalPointDescriptionPlaceholder')}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

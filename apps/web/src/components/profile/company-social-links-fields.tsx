'use client';

import { Input } from '@/components/ui/input';
import type { CompanySocialLinks } from '@rateq/types';
import { useTranslations } from 'next-intl';

const WHATSAPP_PREFIX = '+974';

export function normalizeWhatsappInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const local = digits.startsWith('974') ? digits.slice(3) : digits;
  return `${WHATSAPP_PREFIX}${local}`;
}

interface CompanySocialLinksFieldsProps {
  values: CompanySocialLinks;
  onChange: (patch: Partial<CompanySocialLinks>) => void;
  disabled?: boolean;
}

export function CompanySocialLinksFields({
  values,
  onChange,
  disabled = false,
}: CompanySocialLinksFieldsProps) {
  const t = useTranslations('profilePage');

  return (
    <div className="space-y-4">
      <Field label={t('whatsappNumber')}>
        <div className="flex">
          <span className="inline-flex h-10 items-center rounded-s-lg border border-e-0 border-default bg-slate-50 px-3 text-sm text-secondary dark:bg-dm-elevated">
            {WHATSAPP_PREFIX}
          </span>
          <Input
            value={values.whatsappNumber?.replace(/^\+974/, '') ?? ''}
            onChange={(e) =>
              onChange({
                whatsappNumber: e.target.value.trim()
                  ? normalizeWhatsappInput(e.target.value)
                  : null,
              })
            }
            disabled={disabled}
            className="h-10 rounded-s-none"
            placeholder="5555 1234"
            inputMode="numeric"
            maxLength={12}
          />
        </div>
      </Field>

      <Field label={t('instagramUrl')}>
        <Input
          value={values.instagramUrl ?? ''}
          onChange={(e) => onChange({ instagramUrl: e.target.value.trim() || null })}
          disabled={disabled}
          className="h-10"
          placeholder="https://instagram.com/..."
          maxLength={2048}
        />
      </Field>

      <Field label={t('youtubeUrl')}>
        <Input
          value={values.youtubeUrl ?? ''}
          onChange={(e) => onChange({ youtubeUrl: e.target.value.trim() || null })}
          disabled={disabled}
          className="h-10"
          placeholder="https://youtube.com/..."
          maxLength={2048}
        />
      </Field>

      <Field label={t('facebookUrl')}>
        <Input
          value={values.facebookUrl ?? ''}
          onChange={(e) => onChange({ facebookUrl: e.target.value.trim() || null })}
          disabled={disabled}
          className="h-10"
          placeholder="https://facebook.com/..."
          maxLength={2048}
        />
      </Field>

      <Field label={t('linkedinUrl')}>
        <Input
          value={values.linkedinUrl ?? ''}
          onChange={(e) => onChange({ linkedinUrl: e.target.value.trim() || null })}
          disabled={disabled}
          className="h-10"
          placeholder="https://linkedin.com/..."
          maxLength={2048}
        />
      </Field>

      <Field label={t('twitterUrl')}>
        <Input
          value={values.twitterUrl ?? ''}
          onChange={(e) => onChange({ twitterUrl: e.target.value.trim() || null })}
          disabled={disabled}
          className="h-10"
          placeholder="https://x.com/..."
          maxLength={2048}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-primary">{label}</label>
      {children}
    </div>
  );
}

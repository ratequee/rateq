'use client';

import { Input } from '@/components/ui/input';
import { calculateYearsInBusiness } from '@/lib/company-years';
import { useTranslations } from 'next-intl';

interface CompanyYearsEstablishedFieldProps {
  firstRegistrationDate: string;
  onChange: (value: string) => void;
  pendingRegistrationDate?: string | null;
  fieldKey?: string;
}

export function CompanyYearsEstablishedField({
  firstRegistrationDate,
  onChange,
  pendingRegistrationDate,
  fieldKey = 'firstRegistrationDate',
}: CompanyYearsEstablishedFieldProps) {
  const t = useTranslations('profilePage');
  const yearsInBusiness = firstRegistrationDate
    ? calculateYearsInBusiness(firstRegistrationDate)
    : null;
  const pendingYears =
    pendingRegistrationDate && pendingRegistrationDate !== firstRegistrationDate
      ? calculateYearsInBusiness(pendingRegistrationDate)
      : null;

  return (
    <div data-field={fieldKey}>
      <label className="mb-1.5 block text-sm font-medium text-primary">
        {t('firstRegistrationDate')}
      </label>
      <Input
        type="date"
        value={firstRegistrationDate}
        onChange={(event) => onChange(event.target.value)}
        className="h-11"
        max={new Date().toISOString().slice(0, 10)}
      />
      <p className="mt-1.5 text-xs text-secondary">{t('firstRegistrationDateHint')}</p>
      {yearsInBusiness != null ? (
        <p className="mt-2 text-sm font-medium text-primary">
          {t('yearsInBusinessCalculated', { count: yearsInBusiness })}
        </p>
      ) : null}
      {pendingYears != null ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t('pendingRegistrationDate', {
            date: pendingRegistrationDate,
            count: pendingYears,
          })}
        </p>
      ) : null}
    </div>
  );
}

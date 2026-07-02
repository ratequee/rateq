'use client';

import { Input } from '@/components/ui/input';
import { calculateYearsInBusiness } from '@/lib/company-years';
import { useTranslations } from 'next-intl';

interface CompanyYearsEstablishedFieldProps {
  firstRegistrationDate: string;
  onChange: (value: string) => void;
  fieldKey?: string;
}

export function CompanyYearsEstablishedField({
  firstRegistrationDate,
  onChange,
  fieldKey = 'firstRegistrationDate',
}: CompanyYearsEstablishedFieldProps) {
  const t = useTranslations('profilePage');
  const yearsInBusiness = firstRegistrationDate
    ? calculateYearsInBusiness(firstRegistrationDate)
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
    </div>
  );
}

import type { CompanyPublic } from '@rateq/types';

export function calculateYearsInBusiness(
  registrationDate: string | Date,
  referenceDate: Date = new Date(),
): number {
  const start =
    typeof registrationDate === 'string'
      ? new Date(`${registrationDate.slice(0, 10)}T00:00:00`)
      : registrationDate;

  if (Number.isNaN(start.getTime())) return 0;

  let years = referenceDate.getFullYear() - start.getFullYear();
  const monthDiff = referenceDate.getMonth() - start.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < start.getDate())) {
    years -= 1;
  }

  return Math.max(0, years);
}

export function approximateRegistrationDateFromYears(
  years: number,
  referenceDate: Date = new Date(),
): string {
  const date = new Date(referenceDate);
  date.setFullYear(date.getFullYear() - Math.max(0, years));
  return date.toISOString().slice(0, 10);
}

export function formatRegistrationDateInput(
  company: Pick<CompanyPublic, 'yearsEstablished' | 'firstRegistrationDate'>,
): string {
  if (company.firstRegistrationDate) {
    return company.firstRegistrationDate.slice(0, 10);
  }
  if (company.yearsEstablished != null) {
    return approximateRegistrationDateFromYears(company.yearsEstablished);
  }
  return '';
}

export function getCompanyYearsInBusiness(
  company: Pick<CompanyPublic, 'yearsEstablished' | 'firstRegistrationDate'>,
): number | null {
  if (company.firstRegistrationDate) {
    return calculateYearsInBusiness(company.firstRegistrationDate);
  }
  return company.yearsEstablished;
}

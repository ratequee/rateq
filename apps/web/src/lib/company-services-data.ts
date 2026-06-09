/** Demo services until company services are stored in the API. */
const DEFAULT_SERVICES = [
  'Banking Services',
  'Consumer Protection',
  'Investment Consultancy',
  'Management Consultancy',
  'Financial Advisory',
];

export function getCompanyServices(companyId: string, categoryName?: string | null): string[] {
  if (categoryName) {
    return [categoryName, ...DEFAULT_SERVICES.filter((item) => item !== categoryName)].slice(0, 5);
  }

  const offset = companyId.charCodeAt(0) % DEFAULT_SERVICES.length;
  return [...DEFAULT_SERVICES.slice(offset), ...DEFAULT_SERVICES.slice(0, offset)].slice(0, 5);
}

import type { CompanyVerificationStatus } from '@rateq/types';

export function profileUpdateSuccessMessage(
  verificationStatus: CompanyVerificationStatus | string,
  pendingMessage: string,
  immediateMessage: string,
): string {
  return verificationStatus === 'approved' ? pendingMessage : immediateMessage;
}

export function formatRegistrationDateInput(company: {
  firstRegistrationDate?: string | null;
}): string {
  return company.firstRegistrationDate?.slice(0, 10) ?? '';
}

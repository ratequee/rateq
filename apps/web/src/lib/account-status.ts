import { ApiError } from '@/lib/api';

export const ACCOUNT_DEACTIVATED_API_MESSAGE = 'Account has been deactivated';

export function isAccountDeactivatedApiError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.message === ACCOUNT_DEACTIVATED_API_MESSAGE ||
      err.message.toLowerCase().includes('deactivated'))
  );
}

export function getAccountDeactivatedMessage(err: unknown, fallback: string): string {
  return isAccountDeactivatedApiError(err) ? ACCOUNT_DEACTIVATED_API_MESSAGE : fallback;
}

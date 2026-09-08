import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { getUserFacingError } from '@/lib/user-facing-error';
import type { UserErrorKey } from '@rateq/utils';

/** Localized error resolver bound to the active locale (`errors.*`). */
export function useUserFacingError() {
  const t = useTranslations('errors');

  return useCallback(
    (error: unknown, fallback?: string) =>
      getUserFacingError(error, (key: UserErrorKey) => t(key), fallback),
    [t],
  );
}

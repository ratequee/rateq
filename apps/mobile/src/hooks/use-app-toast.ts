import { useToast } from '@/context/toast-context';
import { getUserFacingError } from '@/lib/user-facing-error';
import type { UserErrorKey } from '@rateq/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useAppToast() {
  const { t } = useTranslation();
  const toast = useToast();

  return useMemo(
    () => ({
      success: (message: string, title?: string) => toast.showSuccess(message, title),
      error: (message: string, title = t('common.error')) => toast.showError(message, title),
      info: (message: string, title?: string) => toast.showInfo(message, title),
      apiError: (err: unknown, fallback?: string) => {
        const message = getUserFacingError(
          err,
          (key: UserErrorKey) => t(`errors.${key}`),
          fallback ?? t('errors.generic'),
        );
        toast.showError(message, t('common.error'));
      },
    }),
    [toast, t],
  );
}

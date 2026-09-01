import { useToast } from '@/context/toast-context';
import { ApiError } from '@/lib/api';
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
      apiError: (err: unknown, fallback: string) =>
        toast.showError(err instanceof ApiError ? err.message : fallback, t('common.error')),
    }),
    [toast, t],
  );
}

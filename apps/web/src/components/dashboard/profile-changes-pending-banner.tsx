'use client';

import { useTranslations } from 'next-intl';

export function ProfileChangesPendingBanner() {
  const t = useTranslations('profilePage');

  return (
    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      {t('profileChangesPending')}
    </p>
  );
}

function requiresAdminApproval(verificationStatus: string): boolean {
  return verificationStatus === 'approved';
}

export function profileUpdateSuccessMessage(
  verificationStatus: string,
  pendingMessage: string,
  immediateMessage: string,
): string {
  return requiresAdminApproval(verificationStatus) ? pendingMessage : immediateMessage;
}

'use client';

import { InviteByEmailForm } from '@/components/dashboard/invite-by-email-form';
import { onboardingApi } from '@/lib/onboarding-api';
import type { InvitationPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

export function CompanyInviteReviewersPanel() {
  const t = useTranslations('invitations');
  const [invitations, setInvitations] = useState<InvitationPublic[]>([]);

  const reload = useCallback(async () => {
    try {
      setInvitations(await onboardingApi.listReviewerInvitations());
    } catch {
      setInvitations([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <InviteByEmailForm
      title={t('inviteReviewerTitle')}
      subtitle={t('inviteReviewerSubtitle')}
      listTitle={t('recentInvites')}
      onInvite={(email) => onboardingApi.inviteReviewer({ email }).then(() => reload())}
      invitations={invitations}
    />
  );
}

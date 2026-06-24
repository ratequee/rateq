'use client';

import { InviteByEmailForm } from '@/components/dashboard/invite-by-email-form';
import { adminApi } from '@/lib/admin-api';
import type { InvitationPublic } from '@rateq/types';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

export function AdminInviteCompanyPanel() {
  const t = useTranslations('invitations');
  const [invitations, setInvitations] = useState<InvitationPublic[]>([]);

  const reload = useCallback(async () => {
    try {
      // No list endpoint for admin company invites — panel is send-only for now.
      setInvitations([]);
    } catch {
      setInvitations([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <InviteByEmailForm
      title={t('inviteCompanyTitle')}
      subtitle={t('inviteCompanySubtitle')}
      onInvite={(email) => adminApi.inviteCompany({ email }).then(() => reload())}
      invitations={invitations}
    />
  );
}

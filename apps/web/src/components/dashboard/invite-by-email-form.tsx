'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { sanitizeEmail } from '@/lib/validation/auth-fields';
import { Loader2, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface InviteByEmailFormProps {
  title: string;
  subtitle: string;
  onInvite: (email: string) => Promise<void>;
  listTitle?: string;
  invitations?: Array<{ id: string; email: string; createdAt: string; acceptedAt: string | null }>;
}

export function InviteByEmailForm({
  title,
  subtitle,
  onInvite,
  listTitle,
  invitations,
}: InviteByEmailFormProps) {
  const t = useTranslations('invitations');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = sanitizeEmail(email).trim().toLowerCase();
    if (!normalized) {
      toast.error(t('emailRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await onInvite(normalized);
      setEmail('');
      toast.success(t('inviteSent'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('inviteError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-subtle surface-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="mt-1 text-sm text-secondary">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
            placeholder={t('emailPlaceholder')}
            className="h-11 ps-10"
            disabled={submitting}
          />
        </div>
        <Button type="submit" disabled={submitting} className="h-11 shrink-0">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendInvite')}
        </Button>
      </form>

      {invitations && invitations.length > 0 ? (
        <div>
          {listTitle ? <p className="mb-2 text-sm font-medium text-primary">{listTitle}</p> : null}
          <ul className="divide-y divide-subtle rounded-xl border border-subtle">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="text-primary">{invitation.email}</span>
                <span className="text-xs text-secondary">
                  {invitation.acceptedAt ? t('accepted') : t('pending')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

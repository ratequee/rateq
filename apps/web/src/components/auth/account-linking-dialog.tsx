'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AccountLinkingRequiredError } from '@/lib/auth-flow-errors';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface AccountLinkingDialogProps {
  request: AccountLinkingRequiredError | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => void | Promise<void>;
}

export function AccountLinkingDialog({
  request,
  loading = false,
  onCancel,
  onSubmit,
}: AccountLinkingDialogProps) {
  const tp = useTranslations('authPage');
  const [password, setPassword] = useState('');

  if (!request) {
    return null;
  }

  const provider =
    request.providerLabel === 'Apple' ? tp('continueWithApple') : tp('continueWithGoogle');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-dm-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-linking-title"
      >
        <h2 id="account-linking-title" className="text-lg font-bold text-ink dark:text-white">
          {tp('linkAccountTitle')}
        </h2>
        <p className="mt-2 text-sm text-ink-muted dark:text-white/75">
          {tp('linkAccountMessage', { email: request.email, provider })}
        </p>

        <div className="mt-5">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder={tp('passwordPlaceholder')}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={() => {
              setPassword('');
              onCancel();
            }}
            disabled={loading}
          >
            {tp('linkAccountCancel')}
          </Button>
          <Button
            type="button"
            variant="gold"
            className="flex-1 rounded-2xl"
            disabled={loading || !password.trim()}
            onClick={() => void onSubmit(password)}
          >
            {loading ? '...' : tp('linkAccountSubmit')}
          </Button>
        </div>
      </div>
    </div>
  );
}

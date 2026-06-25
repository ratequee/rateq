'use client';

import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }

    apiClient<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
      token: null,
    })
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Invalid or expired verification link');
      });
  }, [token]);

  return (
    <AuthLayout variant="login">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold text-ink dark:text-white">Email verification</h2>
        {status === 'loading' && (
          <p className="text-sm text-ink-muted dark:text-slate-300">Verifying...</p>
        )}
        {status !== 'loading' && <p className="text-sm text-ink dark:text-slate-200">{message}</p>}
        <Link href="/login">
          <Button className="w-full">Log in</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-ink-muted dark:text-slate-300">Loading...</div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

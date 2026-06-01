'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <CardTitle>Email verification</CardTitle>
          {status === 'loading' && <p>Verifying...</p>}
          {status !== 'loading' && <p>{message}</p>}
          <Link href="/login">
            <Button>Log in</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

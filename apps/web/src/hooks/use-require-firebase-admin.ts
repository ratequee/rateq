'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from '@/i18n/routing';
import { useRequireVerifiedAuth } from '@/hooks/use-require-verified-auth';
import { useEffect } from 'react';

export function useRequireFirebaseAdmin(): void {
  const { user, isLoading, isFirebaseAdmin, firebaseAdminLoading } = useAuth();
  const router = useRouter();
  useRequireVerifiedAuth();

  useEffect(() => {
    if (isLoading || firebaseAdminLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isFirebaseAdmin) {
      router.replace('/');
    }
  }, [user, isLoading, isFirebaseAdmin, firebaseAdminLoading, router]);
}

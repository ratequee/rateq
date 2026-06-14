'use client';

import { useRequireFirebaseAdmin } from '@/hooks/use-require-firebase-admin';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

export default function AdminReviewsRedirectPage() {
  const router = useRouter();
  useRequireFirebaseAdmin();

  useEffect(() => {
    router.replace('/dashboard/admin/directory');
  }, [router]);

  return null;
}

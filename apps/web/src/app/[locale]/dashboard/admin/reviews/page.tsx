'use client';

import { useRequireAdmin } from '@/hooks/use-require-admin';
import { AdminPermission } from '@rateq/types';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

export default function AdminReviewsRedirectPage() {
  const router = useRouter();
  useRequireAdmin(AdminPermission.DIRECTORY);

  useEffect(() => {
    router.replace('/dashboard/admin/directory');
  }, [router]);

  return null;
}

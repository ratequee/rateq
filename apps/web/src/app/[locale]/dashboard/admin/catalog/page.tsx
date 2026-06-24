'use client';

import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

export default function AdminCatalogRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin/categories');
  }, [router]);

  return null;
}

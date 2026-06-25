'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRequireAdmin } from '@/hooks/use-require-admin';

/** @deprecated Use useRequireAdmin instead */
export function useRequireFirebaseAdmin(): void {
  const { adminAccessLoading } = useAuth();
  useRequireAdmin();

  void adminAccessLoading;
}

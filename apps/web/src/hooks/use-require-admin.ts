'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from '@/i18n/routing';
import { useRequireVerifiedAuth } from '@/hooks/use-require-verified-auth';
import { canAccessAdminRoute, getFirstAllowedAdminRoute } from '@/lib/admin-permissions';
import type { AdminPermission } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { useEffect } from 'react';

export function useRequireAdmin(permission?: AdminPermission): void {
  const { user, isLoading, adminAccess, adminAccessLoading } = useAuth();
  const router = useRouter();
  useRequireVerifiedAuth();

  useEffect(() => {
    if (isLoading || adminAccessLoading) return;

    if (!user || user.role !== UserRole.ADMIN || !adminAccess?.allowed) {
      router.replace('/');
      return;
    }

    if (permission && !canAccessAdminRoute(adminAccess, '', permission)) {
      const fallback = getFirstAllowedAdminRoute(adminAccess);
      router.replace(fallback ?? '/');
    }
  }, [user, isLoading, adminAccess, adminAccessLoading, permission, router]);
}

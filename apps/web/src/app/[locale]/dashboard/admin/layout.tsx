'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useRequireAdmin } from '@/hooks/use-require-admin';
import { getAdminRoutePermissions } from '@/lib/admin-permissions';
import { usePathname } from '@/i18n/routing';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const required = getAdminRoutePermissions(pathname);
  const { ready, allowed } = useRequireAdmin(required.length ? required : undefined);

  if (!ready || !allowed) {
    return (
      <DashboardShell role="admin">
        <div className="flex items-center justify-center py-24 text-secondary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return children;
}

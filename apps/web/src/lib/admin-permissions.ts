import { AdminPermission, hasAdminPermission, type AdminAccess } from '@rateq/types';

export const ADMIN_ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  '/dashboard/admin': AdminPermission.STATS,
  '/dashboard/admin/companies': AdminPermission.COMPANIES,
  '/dashboard/admin/directory': AdminPermission.DIRECTORY,
  '/dashboard/admin/projects': AdminPermission.MODERATION,
  '/dashboard/admin/categories': AdminPermission.CONTENT,
  '/dashboard/admin/blog': AdminPermission.CONTENT,
  '/dashboard/admin/team': AdminPermission.TEAM,
};

export function getFirstAllowedAdminRoute(access: AdminAccess | null): string | null {
  if (!access?.allowed) return null;

  for (const [route, permission] of Object.entries(ADMIN_ROUTE_PERMISSIONS)) {
    if (hasAdminPermission(access.permissions, permission)) {
      return route;
    }
  }

  return null;
}

export function canAccessAdminRoute(
  access: AdminAccess | null,
  pathname: string,
  required?: AdminPermission,
): boolean {
  if (!access?.allowed) return false;

  const permission = required ?? ADMIN_ROUTE_PERMISSIONS[pathname];
  if (!permission) return true;

  return hasAdminPermission(access.permissions, permission);
}

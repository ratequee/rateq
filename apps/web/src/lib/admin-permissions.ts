import { AdminPermission, hasAdminPermission, type AdminAccess } from '@rateq/types';

export const ADMIN_ROUTE_PERMISSIONS: { route: string; permission: AdminPermission }[] = [
  { route: '/dashboard/admin', permission: AdminPermission.STATS },
  { route: '/dashboard/admin/companies', permission: AdminPermission.COMPANIES },
  { route: '/dashboard/admin/directory', permission: AdminPermission.DIRECTORY },
  { route: '/dashboard/admin/reviews', permission: AdminPermission.MODERATION },
  { route: '/dashboard/admin/projects', permission: AdminPermission.DIRECTORY },
  { route: '/dashboard/admin/directory', permission: AdminPermission.INVITATIONS },
  { route: '/dashboard/admin/categories', permission: AdminPermission.CONTENT },
  { route: '/dashboard/admin/blog', permission: AdminPermission.CONTENT },
  { route: '/dashboard/admin/settings', permission: AdminPermission.CONTENT },
  { route: '/dashboard/admin/team', permission: AdminPermission.TEAM },
];

export function getFirstAllowedAdminRoute(access: AdminAccess | null): string | null {
  if (!access?.allowed) return null;

  for (const { route, permission } of ADMIN_ROUTE_PERMISSIONS) {
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

  if (required) {
    return hasAdminPermission(access.permissions, required);
  }

  const matches = ADMIN_ROUTE_PERMISSIONS.filter((item) => item.route === pathname);
  if (matches.length === 0) return true;

  return matches.some((item) => hasAdminPermission(access.permissions, item.permission));
}

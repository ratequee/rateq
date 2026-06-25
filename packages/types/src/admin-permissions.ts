export enum AdminPermission {
  STATS = 'STATS',
  COMPANIES = 'COMPANIES',
  DIRECTORY = 'DIRECTORY',
  MODERATION = 'MODERATION',
  CONTENT = 'CONTENT',
  INVITATIONS = 'INVITATIONS',
  TEAM = 'TEAM',
}

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  AdminPermission.STATS,
  AdminPermission.COMPANIES,
  AdminPermission.DIRECTORY,
  AdminPermission.MODERATION,
  AdminPermission.CONTENT,
  AdminPermission.INVITATIONS,
  AdminPermission.TEAM,
];

export const GRANTABLE_ADMIN_PERMISSIONS: AdminPermission[] = ALL_ADMIN_PERMISSIONS.filter(
  (permission) => permission !== AdminPermission.TEAM,
);

export interface AdminAccess {
  allowed: boolean;
  permissions: AdminPermission[];
}

export function hasAdminPermission(
  permissions: AdminPermission[] | undefined,
  required: AdminPermission,
): boolean {
  if (!permissions?.length) return false;
  if (permissions.includes(AdminPermission.TEAM)) return true;
  return permissions.includes(required);
}

export function canAccessAdminDashboard(permissions: AdminPermission[] | undefined): boolean {
  return Boolean(permissions?.length);
}

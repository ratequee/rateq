export enum AdminPermission {
  STATS = 'STATS',
  COMPANIES = 'COMPANIES',
  DIRECTORY = 'DIRECTORY',
  MODERATION = 'MODERATION',
  /** @deprecated Prefer CATEGORIES, BLOG, SETTINGS — kept for DB compatibility. */
  CONTENT = 'CONTENT',
  CATEGORIES = 'CATEGORIES',
  BLOG = 'BLOG',
  SETTINGS = 'SETTINGS',
  PROJECTS = 'PROJECTS',
  INVITATIONS = 'INVITATIONS',
  EMAIL_MARKETING = 'EMAIL_MARKETING',
  TEAM = 'TEAM',
}

/** Permissions granted to full admins and shown as independent access controls. */
export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  AdminPermission.STATS,
  AdminPermission.COMPANIES,
  AdminPermission.DIRECTORY,
  AdminPermission.MODERATION,
  AdminPermission.PROJECTS,
  AdminPermission.CATEGORIES,
  AdminPermission.BLOG,
  AdminPermission.SETTINGS,
  AdminPermission.INVITATIONS,
  AdminPermission.EMAIL_MARKETING,
  AdminPermission.TEAM,
];

export const GRANTABLE_ADMIN_PERMISSIONS: AdminPermission[] = ALL_ADMIN_PERMISSIONS.filter(
  (permission) => permission !== AdminPermission.TEAM,
);

/** Legacy CONTENT unlocks the three content sections until migration cleans arrays. */
const CONTENT_EQUIVALENTS: AdminPermission[] = [
  AdminPermission.CATEGORIES,
  AdminPermission.BLOG,
  AdminPermission.SETTINGS,
];

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
  if (permissions.includes(required)) return true;
  if (CONTENT_EQUIVALENTS.includes(required) && permissions.includes(AdminPermission.CONTENT)) {
    return true;
  }
  return false;
}

export function canAccessAdminDashboard(permissions: AdminPermission[] | undefined): boolean {
  return Boolean(permissions?.length);
}

import { Injectable } from '@nestjs/common';
import type { AdminPermission as PrismaAdminPermission, User } from '@prisma/client';
import {
  AdminPermission,
  ALL_ADMIN_PERMISSIONS,
  canAccessAdminDashboard,
  hasAdminPermission,
  type AdminAccess,
} from '@rateq/types';

@Injectable()
export class AdminPermissionsService {
  toPermissions(user: Pick<User, 'adminPermissions'>): AdminPermission[] {
    return (user.adminPermissions ?? []) as AdminPermission[];
  }

  getAdminAccess(user: Pick<User, 'role' | 'adminPermissions'>): AdminAccess {
    const permissions = this.toPermissions(user);
    return {
      allowed: user.role === 'ADMIN' && canAccessAdminDashboard(permissions),
      permissions,
    };
  }

  userHasPermission(
    user: Pick<User, 'role' | 'adminPermissions'>,
    required: AdminPermission,
  ): boolean {
    if (user.role !== 'ADMIN') return false;
    return hasAdminPermission(this.toPermissions(user), required);
  }

  isTeamManager(user: Pick<User, 'role' | 'adminPermissions'>): boolean {
    return this.userHasPermission(user, AdminPermission.TEAM);
  }

  fullPermissions(): AdminPermission[] {
    return [...ALL_ADMIN_PERMISSIONS];
  }

  toPrismaPermissions(permissions: AdminPermission[]): PrismaAdminPermission[] {
    return permissions as PrismaAdminPermission[];
  }
}

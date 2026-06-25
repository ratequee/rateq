import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminPermission, AuthenticatedUser } from '@rateq/types';
import { ADMIN_PERMISSIONS_KEY } from '../../../common/decorators/require-admin-permission.decorator';
import { AuthRepository } from '../repositories/auth.repository';
import { AdminPermissionsService } from '../services/admin-permissions.service';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authRepository: AuthRepository,
    private readonly adminPermissions: AdminPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AdminPermission[] | undefined>(
      ADMIN_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const dbUser = await this.authRepository.findUserById(user.id);

    if (!dbUser || dbUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const allowed = required.some((permission) =>
      this.adminPermissions.userHasPermission(dbUser, permission),
    );

    if (!allowed) {
      throw new ForbiddenException('You do not have permission for this action');
    }

    return true;
  }
}

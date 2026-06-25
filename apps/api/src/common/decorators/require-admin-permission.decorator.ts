import { SetMetadata } from '@nestjs/common';
import type { AdminPermission } from '@rateq/types';

export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

export const RequireAdminPermission = (...permissions: AdminPermission[]) =>
  SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);

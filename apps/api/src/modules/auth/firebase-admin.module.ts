import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AdminPermissionGuard } from './guards/admin-permission.guard';
import { FirebaseAdminGuard } from './guards/firebase-admin.guard';
import { AuthRepository } from './repositories/auth.repository';
import { AdminPermissionsService } from './services/admin-permissions.service';
import { FirebaseAdminAccessService } from './services/firebase-admin-access.service';
import { FirebaseAdminService } from './services/firebase-admin.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    AuthRepository,
    AdminPermissionsService,
    FirebaseAdminAccessService,
    FirebaseAdminGuard,
    AdminPermissionGuard,
    FirebaseAdminService,
  ],
  exports: [
    AuthRepository,
    AdminPermissionsService,
    FirebaseAdminAccessService,
    FirebaseAdminGuard,
    AdminPermissionGuard,
    FirebaseAdminService,
  ],
})
export class FirebaseAdminModule {}

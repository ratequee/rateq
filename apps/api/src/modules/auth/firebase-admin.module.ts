import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FirebaseAdminGuard } from './guards/firebase-admin.guard';
import { AuthRepository } from './repositories/auth.repository';
import { FirebaseAdminAccessService } from './services/firebase-admin-access.service';
import { FirebaseAdminService } from './services/firebase-admin.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AuthRepository, FirebaseAdminAccessService, FirebaseAdminGuard, FirebaseAdminService],
  exports: [AuthRepository, FirebaseAdminAccessService, FirebaseAdminGuard, FirebaseAdminService],
})
export class FirebaseAdminModule {}

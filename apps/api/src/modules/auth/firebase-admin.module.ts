import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FirebaseAdminGuard } from './guards/firebase-admin.guard';
import { AuthRepository } from './repositories/auth.repository';
import { FirebaseAdminAccessService } from './services/firebase-admin-access.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuthRepository, FirebaseAdminAccessService, FirebaseAdminGuard],
  exports: [FirebaseAdminAccessService, FirebaseAdminGuard, AuthRepository],
})
export class FirebaseAdminModule {}

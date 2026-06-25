import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AdminActivityService } from './admin-activity.service';
import { AdminActivityRepository } from './repositories/admin-activity.repository';

@Module({
  imports: [DatabaseModule],
  providers: [AdminActivityRepository, AdminActivityService],
  exports: [AdminActivityService],
})
export class AdminActivityModule {}

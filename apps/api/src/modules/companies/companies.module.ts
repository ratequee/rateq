import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FirebaseAdminModule } from '../auth/firebase-admin.module';
import { CategoriesModule } from '../categories/categories.module';
import { PhoneVerificationModule } from '../phone-verification/phone-verification.module';
import { AdminCompaniesController } from './admin-companies.controller';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompaniesRepository } from './repositories/companies.repository';

@Module({
  imports: [DatabaseModule, FirebaseAdminModule, CategoriesModule, PhoneVerificationModule],
  controllers: [CompaniesController, AdminCompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}

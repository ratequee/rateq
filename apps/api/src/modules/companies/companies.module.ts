import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { EmailModule } from '../auth/email.module';
import { FirebaseAdminModule } from '../auth/firebase-admin.module';
import { CategoriesModule } from '../categories/categories.module';
import { PhoneVerificationModule } from '../phone-verification/phone-verification.module';
import { AdminCompaniesController } from './admin-companies.controller';
import { AdminCompanyCatalogController } from './admin-company-catalog.controller';
import { CompanyCatalogController } from './company-catalog.controller';
import { CompanyCatalogService } from './company-catalog.service';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AdminInvitationsController } from './admin-invitations.controller';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompaniesRepository } from './repositories/companies.repository';

@Module({
  imports: [
    DatabaseModule,
    FirebaseAdminModule,
    EmailModule,
    CategoriesModule,
    PhoneVerificationModule,
  ],
  controllers: [
    CompaniesController,
    AdminCompaniesController,
    AdminCompanyCatalogController,
    CompanyCatalogController,
    InvitationsController,
    AdminInvitationsController,
  ],
  providers: [CompaniesService, CompaniesRepository, CompanyCatalogService, InvitationsService],
  exports: [CompaniesService, CompaniesRepository, CompanyCatalogService, InvitationsService],
})
export class CompaniesModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { EmailModule } from '../auth/email.module';
import { FirebaseAdminModule } from '../auth/firebase-admin.module';
import { AdminActivityModule } from '../admin-activity/admin-activity.module';
import { CategoriesModule } from '../categories/categories.module';
import { PhoneVerificationModule } from '../phone-verification/phone-verification.module';
import { AdminCompaniesController } from './admin-companies.controller';
import { AdminCompanyCatalogController } from './admin-company-catalog.controller';
import { CompanyCatalogController } from './company-catalog.controller';
import { CompanyCatalogService } from './company-catalog.service';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { AdminInvitationsController } from './admin-invitations.controller';
import { ReviewerInvitationRequestsService } from './reviewer-invitation-requests.service';
import { ReviewerInvitationRequestsController } from './reviewer-invitation-requests.controller';
import { AdminReviewerInvitationRequestsController } from './admin-reviewer-invitation-requests.controller';
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
    AdminActivityModule,
  ],
  controllers: [
    CompaniesController,
    AdminCompaniesController,
    AdminCompanyCatalogController,
    CompanyCatalogController,
    InvitationsController,
    AdminInvitationsController,
    ReviewerInvitationRequestsController,
    AdminReviewerInvitationRequestsController,
  ],
  providers: [
    CompaniesService,
    CompaniesRepository,
    CompanyCatalogService,
    InvitationsService,
    ReviewerInvitationRequestsService,
  ],
  exports: [
    CompaniesService,
    CompaniesRepository,
    CompanyCatalogService,
    InvitationsService,
    ReviewerInvitationRequestsService,
  ],
})
export class CompaniesModule {}

import { Module } from '@nestjs/common';
import { EmailModule } from '../auth/email.module';
import { CompaniesModule } from '../companies/companies.module';
import { PhoneVerificationModule } from '../phone-verification/phone-verification.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfilesRepository } from './repositories/user-profiles.repository';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [CompaniesModule, PhoneVerificationModule, EmailModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserProfilesRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}

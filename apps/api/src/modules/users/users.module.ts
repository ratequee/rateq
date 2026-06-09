import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfilesRepository } from './repositories/user-profiles.repository';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [CompaniesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserProfilesRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}

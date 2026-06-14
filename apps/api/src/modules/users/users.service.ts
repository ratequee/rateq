import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole as PrismaUserRole } from '@prisma/client';
import type {
  AdminUpdateUserInput,
  AuthenticatedUser,
  CompleteReviewerProfileInput,
  MessageResponse,
  OnboardingStatus,
  PaginatedUsersResponse,
  UserProfile,
} from '@rateq/types';
import { UserRole } from '@rateq/types';
import * as bcrypt from 'bcrypt';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { CompaniesRepository } from '../companies/repositories/companies.repository';
import { UserProfilesRepository } from './repositories/user-profiles.repository';
import { UsersRepository } from './repositories/users.repository';
import { buildOnboardingStatus } from './mappers/onboarding.mapper';
import { toUserProfile } from './mappers/user.mapper';
import { PhoneOtpService } from '../phone-verification/phone-otp.service';
import type { SyncPhoneVerificationDto } from './dto/phone-otp.dto';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userProfilesRepository: UserProfilesRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly phoneOtpService: PhoneOtpService,
  ) {}

  async syncPhoneVerification(
    userId: string,
    dto: SyncPhoneVerificationDto,
  ): Promise<MessageResponse> {
    return this.phoneOtpService.syncVerifiedPhone(userId, dto.phone, dto.context);
  }

  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const [reviewerProfile, company] = await Promise.all([
      this.userProfilesRepository.findByUserId(userId),
      this.companiesRepository.findByOwnerId(userId),
    ]);

    return buildOnboardingStatus({ reviewerProfile, company });
  }

  async completeReviewerProfile(
    userId: string,
    dto: CompleteReviewerProfileInput,
  ): Promise<OnboardingStatus> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Verify your email before completing your profile');
    }

    const existingCompany = await this.companiesRepository.findByOwnerId(userId);

    if (existingCompany) {
      throw new ConflictException('A company profile already exists for this account');
    }

    const phone = dto.phone.trim();
    await this.phoneOtpService.assertPhoneVerified(userId, phone, 'reviewer');

    await this.userProfilesRepository.upsert(userId, {
      fullName: dto.fullName.trim(),
      phone,
      city: dto.city.trim(),
      country: dto.country.trim(),
      bio: dto.bio?.trim() ?? '',
      avatarUrl: dto.avatarUrl,
    });

    return this.getOnboardingStatus(userId);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserProfile(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<MessageResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password change is not available for accounts signed in with Google',
      );
    }

    const currentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.updatePassword(userId, passwordHash);
    await this.usersRepository.revokeAllSessions(userId);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async listUsers(query: ListUsersQueryDto): Promise<PaginatedUsersResponse> {
    const filters = {
      role: query.role as PrismaUserRole | undefined,
      isVerified: query.isVerified,
      search: query.search,
      page: query.page,
      limit: query.limit,
    };

    const [users, total] = await Promise.all([
      this.usersRepository.findMany(filters),
      this.usersRepository.count(filters),
    ]);

    return {
      data: users.map(toUserProfile),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findById(id: string): Promise<UserProfile> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserProfile(user);
  }

  async adminUpdate(
    targetId: string,
    actor: AuthenticatedUser,
    dto: AdminUpdateUserInput,
  ): Promise<UserProfile> {
    const user = await this.usersRepository.findById(targetId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.role === UserRole.ADMIN && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can assign the ADMIN role');
    }

    const isDemotingAdmin =
      user.role === PrismaUserRole.ADMIN && dto.role !== undefined && dto.role !== UserRole.ADMIN;

    if (isDemotingAdmin) {
      const adminCount = await this.usersRepository.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the only admin account');
      }
    }

    const updated = await this.usersRepository.updateById(targetId, {
      ...(dto.role !== undefined && { role: dto.role as PrismaUserRole }),
      ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    if (dto.isActive === false) {
      await this.usersRepository.revokeAllSessions(targetId);
    }

    return toUserProfile(updated);
  }

  async adminDelete(targetId: string, actor: AuthenticatedUser): Promise<MessageResponse> {
    if (targetId === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.usersRepository.findById(targetId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === PrismaUserRole.ADMIN) {
      const adminCount = await this.usersRepository.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the only admin account');
      }
    }

    await this.usersRepository.deleteById(targetId);

    return { message: 'User deleted successfully' };
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CompleteReviewerProfileDto } from './dto/complete-reviewer-profile.dto';
import { OnboardingStatusDto } from './dto/onboarding-status.dto';
import { PaginatedUsersDto, UserProfileDto } from './dto/user-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user full profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/onboarding')
  @ApiOperation({ summary: 'Get profile completion status for onboarding' })
  @ApiResponse({ status: 200, type: OnboardingStatusDto })
  getOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getOnboardingStatus(user.id);
  }

  @Patch('me/profile/reviewer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete reviewer profile (onboarding)' })
  @ApiResponse({ status: 200, type: OnboardingStatusDto })
  completeReviewerProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteReviewerProfileDto,
  ) {
    return this.usersService.completeReviewerProfile(user.id, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for the current user' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List users with pagination and filters (admin)' })
  @ApiResponse({ status: 200, type: PaginatedUsersDto })
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role or verification status (admin)' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  adminUpdate(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdate(id, actor, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account (admin)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  adminDelete(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.adminDelete(id, actor);
  }
}

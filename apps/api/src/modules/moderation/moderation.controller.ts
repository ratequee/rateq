import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { AdminPermission, UserRole } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { ListReviewsQueryDto } from '../reviews/dto/list-reviews-query.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ModerationRepository } from './repositories/moderation.repository';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
@ApiBearerAuth()
@Controller('moderation')
@Roles(UserRole.ADMIN)
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.MODERATION)
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly moderationRepository: ModerationRepository,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get('reviews')
  @ApiOperation({ summary: 'List all reviews for admin moderation' })
  listReviews(@Query() query: ListReviewsQueryDto) {
    return this.reviewsService.listForAdmin(query);
  }

  @Get('reviews/pending')
  @ApiOperation({ summary: 'List pending reviews for admin moderation (legacy alias)' })
  listPending(@Query() query: ListReviewsQueryDto) {
    return this.reviewsService.listForAdmin({ ...query, status: query.status ?? undefined });
  }

  @Patch('reviews/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually approve a review' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async approve(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualApprove(id, admin.id);
    return { message: 'Review approved' };
  }

  @Patch('reviews/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually reject a review' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async reject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualReject(id, admin.id);
    return { message: 'Review rejected' };
  }

  @Patch('reviews/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a negative review to company-reviewer resolution' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async resolve(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualResolve(id, admin.id);
    return { message: 'Review sent for resolution' };
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a published review' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteReview(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualDelete(id, admin.id);
    return { message: 'Review deleted' };
  }

  @Patch('reviews/:id/reply/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending company reply' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async approveReply(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualApproveReply(id, admin.id);
    return { message: 'Reply approved' };
  }

  @Patch('reviews/:id/reply/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending company reply' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async rejectReply(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualRejectReply(id, admin.id);
    return { message: 'Reply rejected' };
  }

  @Delete('reviews/:id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a company reply on a review' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteReply(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.adminDeleteReply(id, admin.id);
    return { message: 'Reply deleted' };
  }

  @Get('reviews/:id/logs')
  @ApiOperation({ summary: 'Get moderation logs for a review' })
  getLogs(@Param('id') id: string) {
    return this.moderationRepository.findLogsByReviewId(id);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List company projects for admin moderation' })
  listProjects(@Query() query: ListProjectsQueryDto) {
    return this.moderationService.listProjects(query);
  }

  @Patch('projects/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending company project' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async approveProject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualApproveProject(id, admin.id);
    return { message: 'Project approved' };
  }

  @Patch('projects/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending company project' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async rejectProject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualRejectProject(id, admin.id);
    return { message: 'Project rejected' };
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a company project' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteProject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualDeleteProject(id, admin.id);
    return { message: 'Project deleted' };
  }
}

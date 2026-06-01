import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { toReviewPublic } from '../reviews/mappers/review.mapper';
import { ReviewsRepository } from '../reviews/repositories/reviews.repository';
import { ModerationService } from './moderation.service';
import { ModerationRepository } from './repositories/moderation.repository';

@ApiTags('moderation')
@ApiBearerAuth()
@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly moderationRepository: ModerationRepository,
    private readonly reviewsRepository: ReviewsRepository,
  ) {}

  @Get('reviews/pending')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List pending reviews for admin moderation (highest score first)' })
  async listPending(@Query() query: PaginationDto) {
    const [reviews, total] = await Promise.all([
      this.reviewsRepository.findPending(query.page, query.limit),
      this.reviewsRepository.countPending(),
    ]);

    return {
      data: reviews.map(toReviewPublic),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  @Patch('reviews/:id/approve')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually approve a review' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async approve(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualApprove(id, admin.id);
    return { message: 'Review approved' };
  }

  @Patch('reviews/:id/reject')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually reject a review' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async reject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualReject(id, admin.id);
    return { message: 'Review rejected' };
  }

  @Get('reviews/:id/logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get moderation logs for a review' })
  getLogs(@Param('id') id: string) {
    return this.moderationRepository.findLogsByReviewId(id);
  }
}

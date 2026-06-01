import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewReplyDto } from './dto/create-reply.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { PaginatedReviewsDto, ReviewPublicDto } from './dto/review-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review (queued for moderation)' })
  @ApiResponse({ status: 201, type: ReviewPublicDto })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
    @Req() request: Request,
  ) {
    return this.reviewsService.submit(user, dto, request);
  }

  @Get('company/:companyId/manage')
  @ApiBearerAuth()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all reviews for owned company (includes pending/rejected)' })
  @ApiResponse({ status: 200, type: PaginatedReviewsDto })
  listByCompanyForOwner(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId') companyId: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.reviewsService.listByCompanyForOwner(user, companyId, query);
  }

  @Public()
  @Get('company/:companyId')
  @ApiOperation({ summary: 'List reviews for a company (approved only for public)' })
  @ApiResponse({ status: 200, type: PaginatedReviewsDto })
  listByCompany(@Param('companyId') companyId: string, @Query() query: ListReviewsQueryDto) {
    return this.reviewsService.listByCompany(companyId, query);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reviews submitted by the current user' })
  @ApiResponse({ status: 200, type: PaginatedReviewsDto })
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationDto) {
    return this.reviewsService.listMyReviews(user.id, query.page, query.limit);
  }

  @Post(':reviewId/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Company owner reply to an approved review' })
  @ApiResponse({ status: 201, type: ReviewPublicDto })
  reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reviewId') reviewId: string,
    @Body() dto: CreateReviewReplyDto,
  ) {
    return this.reviewsService.replyToReview(user, reviewId, dto);
  }
}

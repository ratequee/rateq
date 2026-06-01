import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@rateq/types';

export class ReviewReplyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: string;
}

export class ReviewAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;
}

export class ReviewPublicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: ReviewStatus })
  status!: ReviewStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: ReviewAuthorDto })
  author?: ReviewAuthorDto;

  @ApiPropertyOptional({ type: ReviewReplyDto, nullable: true })
  reply?: ReviewReplyDto | null;
}

export class PaginatedReviewsDto {
  @ApiProperty({ type: [ReviewPublicDto] })
  data!: ReviewPublicDto[];

  @ApiProperty()
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

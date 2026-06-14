import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@rateq/types';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListReviewsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: 'Filter by reviewer user id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by company id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by company category id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search review title, content, company, or author email' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

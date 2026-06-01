import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@rateq/types';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListReviewsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}

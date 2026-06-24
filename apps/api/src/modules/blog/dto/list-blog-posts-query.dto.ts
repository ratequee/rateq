import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListBlogPostsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['en', 'ar'], default: 'en' })
  @IsOptional()
  @IsIn(['en', 'ar'])
  locale: 'en' | 'ar' = 'en';
}

export class GetBlogPostQueryDto {
  @ApiPropertyOptional({ enum: ['en', 'ar'], default: 'en' })
  @IsOptional()
  @IsIn(['en', 'ar'])
  locale: 'en' | 'ar' = 'en';
}

export class AdminListBlogPostsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum CompanySortOption {
  RATING = 'rating',
  REVIEWS = 'reviews',
  NEWEST = 'newest',
  NAME = 'name',
}

export class SearchCompaniesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search company name or description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ enum: CompanySortOption, default: CompanySortOption.RATING })
  @IsOptional()
  @IsEnum(CompanySortOption)
  sort?: CompanySortOption;
}

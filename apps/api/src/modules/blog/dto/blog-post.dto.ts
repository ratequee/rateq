import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BlogPostTranslationDto {
  @ApiProperty({ enum: ['en', 'ar'] })
  @IsIn(['en', 'ar'])
  locale!: 'en' | 'ar';

  @ApiProperty({ minLength: 2, maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;
}

export class CreateBlogPostDto {
  @ApiPropertyOptional({ enum: ['draft', 'published'], default: 'draft' })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiProperty({ type: [BlogPostTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlogPostTranslationDto)
  translations!: BlogPostTranslationDto[];
}

export class UpdateBlogPostDto {
  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUrl()
  coverUrl?: string | null;

  @ApiPropertyOptional({ description: 'ISO date string', nullable: true })
  @IsOptional()
  @IsString()
  publishedAt?: string | null;

  @ApiPropertyOptional({ type: [BlogPostTranslationDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlogPostTranslationDto)
  translations?: BlogPostTranslationDto[];
}

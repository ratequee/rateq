import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ReviewServiceRatingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryServiceId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'Great experience' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ description: 'FingerprintJS visitorId' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceFingerprint?: string;

  @ApiPropertyOptional({ type: [ReviewServiceRatingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewServiceRatingDto)
  serviceRatings?: ReviewServiceRatingDto[];

  @ApiPropertyOptional({ type: [String], description: 'Firebase URLs for proof attachments' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  proofUrls?: string[];
}

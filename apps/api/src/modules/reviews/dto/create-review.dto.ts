import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
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
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

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

  @ApiProperty({
    type: [String],
    description: 'Firebase URLs for required proof attachments (1–8 files, 10 MB each)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  proofUrls!: string[];
}

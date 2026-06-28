import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Services' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionAr?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  serviceIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  activityIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  yearsEstablished?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  publicProjectCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  privateProjectCount?: number;

  @ApiProperty({ example: 'https://cdn.example.com/logo.png' })
  @IsUrl()
  @MaxLength(2048)
  logo!: string;

  @ApiProperty({ example: 'https://cdn.example.com/cover.png' })
  @IsUrl()
  @MaxLength(2048)
  coverUrl!: string;

  @ApiProperty({ example: 'Building 12, West Bay, Doha' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @ApiProperty({ example: 25.2854 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 51.531 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ example: '+974 5555 1234' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone number format is invalid' })
  phone!: string;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({ example: 'CR-123456' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  crNumber!: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  validationDate!: string;

  @ApiProperty({ example: 'https://cdn.example.com/registration.pdf' })
  @IsUrl()
  @MaxLength(2048)
  registrationDocUrl!: string;

  @ApiProperty({ example: 'https://cdn.example.com/establishment-card.pdf' })
  @IsUrl()
  @MaxLength(2048)
  establishmentCardUrl!: string;

  @ApiProperty({ example: 'https://cdn.example.com/trade-license.pdf' })
  @IsUrl()
  @MaxLength(2048)
  tradeLicenseUrl!: string;

  @ApiProperty({ example: 'Qatar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @ApiProperty({ example: 'Doha' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;
}

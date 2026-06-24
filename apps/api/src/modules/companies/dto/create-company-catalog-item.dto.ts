import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyCatalogType } from '@rateq/types';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyCatalogItemDto {
  @ApiProperty({ enum: ['service', 'activity'] })
  @IsEnum(['service', 'activity'] satisfies CompanyCatalogType[])
  type!: CompanyCatalogType;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nameEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nameAr!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

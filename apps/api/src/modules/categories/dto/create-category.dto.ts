import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Technology' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn!: string;

  @ApiProperty({ example: 'التكنولوجيا' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAr!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2048)
  iconUrl?: string | null;
}

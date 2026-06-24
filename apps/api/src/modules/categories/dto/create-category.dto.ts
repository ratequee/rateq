import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

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
}

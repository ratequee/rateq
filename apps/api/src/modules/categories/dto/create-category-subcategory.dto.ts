import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategorySubcategoryDto {
  @ApiProperty({ example: 'Fine dining' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameEn!: string;

  @ApiProperty({ example: 'مطاعم فاخرة' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAr!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Services' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  logo?: string;

  @ApiProperty({ example: 'SA' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @ApiProperty({ example: 'Riyadh' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;
}

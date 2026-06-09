import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
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
  @MaxLength(5000)
  description?: string;

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

  @ApiProperty({ example: '+974 5555 1234' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone number format is invalid' })
  phone!: string;

  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxx' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  categoryId!: string;

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

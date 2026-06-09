import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CompleteReviewerProfileDto {
  @ApiProperty({ example: 'Sara Al-Mansouri' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: '+974 5555 1234' })
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone!: string;

  @ApiProperty({ example: 'Doha' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Qatar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiProperty({ example: 'https://storage.example.com/avatar.jpg' })
  @IsUrl()
  @MaxLength(2048)
  avatarUrl!: string;
}

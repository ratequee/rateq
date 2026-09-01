import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class SendMarketingEmailDto {
  @ApiProperty({ type: [String], example: ['user@example.com'] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsEmail({}, { each: true })
  recipients!: string[];

  @ApiProperty({ example: 'New features on RateQ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: 'Discover what is new on RateQ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  heading!: string;

  @ApiProperty({ example: 'We have launched new tools to help you find trusted companies.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message!: string;

  @ApiPropertyOptional({ example: 'Visit RateQ' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string;

  @ApiPropertyOptional({ example: 'https://rateq.com' })
  @ValidateIf((dto: SendMarketingEmailDto) => Boolean(dto.ctaLabel?.trim()))
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  ctaUrl?: string;
}

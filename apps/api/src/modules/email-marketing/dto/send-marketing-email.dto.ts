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
  @MaxLength(120)
  subjectEn!: string;

  @ApiProperty({ example: 'ميزات جديدة على RateQ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  subjectAr!: string;

  @ApiProperty({ example: 'Discover what is new on RateQ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  headingEn!: string;

  @ApiProperty({ example: 'اكتشف الجديد على RateQ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  headingAr!: string;

  @ApiProperty({ example: 'We have launched new tools to help you find trusted companies.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  messageEn!: string;

  @ApiProperty({ example: 'أطلقنا أدوات جديدة لمساعدتك في العثور على شركات موثوقة.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  messageAr!: string;

  @ApiPropertyOptional({ example: 'Visit RateQ' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabelEn?: string;

  @ApiPropertyOptional({ example: 'زيارة RateQ' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabelAr?: string;

  @ApiPropertyOptional({ example: 'https://rateq.com' })
  @ValidateIf(
    (dto: SendMarketingEmailDto) =>
      Boolean(dto.ctaLabelEn?.trim()) || Boolean(dto.ctaLabelAr?.trim()),
  )
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  ctaUrl?: string;
}

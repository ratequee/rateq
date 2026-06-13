import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;

export class SendPhoneOtpDto {
  @ApiProperty({ example: '+974 5555 1234' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone number format is invalid' })
  phone!: string;

  @ApiProperty({ enum: ['reviewer', 'company'] })
  @IsIn(['reviewer', 'company'])
  context!: 'reviewer' | 'company';
}

export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  code!: string;

  @ApiProperty({ enum: ['reviewer', 'company'] })
  @IsIn(['reviewer', 'company'])
  context!: 'reviewer' | 'company';
}

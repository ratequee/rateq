import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;

export class SyncPhoneVerificationDto {
  @ApiProperty({ example: '+974 5555 1234' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone number format is invalid' })
  phone!: string;

  @ApiProperty({ enum: ['reviewer', 'company'] })
  @IsIn(['reviewer', 'company'])
  context!: 'reviewer' | 'company';
}

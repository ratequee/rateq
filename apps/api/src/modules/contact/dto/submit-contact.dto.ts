import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { ContactSubject } from '@rateq/types';

const PHONE_PATTERN = /^[+]?[\d\s()-]{6,30}$/;

const CONTACT_SUBJECTS: ContactSubject[] = ['general', 'support', 'business', 'partnership'];

export class SubmitContactDto {
  @ApiProperty({ example: 'Ahmed Al-Thani' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '+974 0000 0000' })
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone number format is invalid' })
  phone!: string;

  @ApiProperty({ enum: CONTACT_SUBJECTS, example: 'general' })
  @IsIn(CONTACT_SUBJECTS)
  subject!: ContactSubject;

  @ApiProperty({ example: 'I would like to know more about listing my business on RateQ.' })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  message!: string;
}

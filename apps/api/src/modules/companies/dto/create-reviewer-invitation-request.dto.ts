import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReviewerInvitationRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  reviewerName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  serviceProvided!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  proofUrls!: string[];
}

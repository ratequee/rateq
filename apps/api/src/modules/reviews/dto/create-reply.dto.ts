import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReviewReplyDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  content!: string;
}

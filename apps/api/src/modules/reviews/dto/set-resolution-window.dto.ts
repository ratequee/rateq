import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';

const ALLOWED_RESOLUTION_WINDOW_DAYS = [7, 10] as const;

export type ResolutionWindowDays = (typeof ALLOWED_RESOLUTION_WINDOW_DAYS)[number];

export class SetResolutionWindowDto {
  @ApiProperty({ enum: ALLOWED_RESOLUTION_WINDOW_DAYS, example: 7 })
  @Type(() => Number)
  @IsInt()
  @IsIn(ALLOWED_RESOLUTION_WINDOW_DAYS)
  days!: ResolutionWindowDays;
}

import { ApiProperty } from '@nestjs/swagger';

export class PlatformStatsDto {
  @ApiProperty()
  totalCompanies!: number;

  @ApiProperty()
  totalReviewers!: number;

  @ApiProperty()
  totalReviews!: number;
}

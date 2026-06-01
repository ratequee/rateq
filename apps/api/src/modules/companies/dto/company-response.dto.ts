import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyPublicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  logo!: string | null;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  ratingAverage!: number;

  @ApiProperty()
  reviewCount!: number;

  @ApiProperty()
  createdAt!: string;
}

export class CompanyDetailDto extends CompanyPublicDto {
  @ApiProperty()
  updatedAt!: string;
}

export class CompanyDashboardStatsDto {
  @ApiProperty()
  totalReviews!: number;

  @ApiProperty()
  pendingReviews!: number;

  @ApiProperty()
  approvedReviews!: number;

  @ApiProperty()
  rejectedReviews!: number;

  @ApiProperty()
  averageRating!: number;
}

export class CompanyDashboardDto {
  @ApiProperty({ type: CompanyDetailDto })
  company!: CompanyDetailDto;

  @ApiProperty({ type: CompanyDashboardStatsDto })
  stats!: CompanyDashboardStatsDto;
}

export class PaginatedCompaniesDto {
  @ApiProperty({ type: [CompanyPublicDto] })
  data!: CompanyPublicDto[];

  @ApiProperty()
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

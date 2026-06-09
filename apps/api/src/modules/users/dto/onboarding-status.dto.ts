import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewerProfileDto {
  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  bio!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;
}

export class CompanyProfileDetailDto {
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

  @ApiPropertyOptional({ nullable: true })
  coverUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiPropertyOptional({ nullable: true })
  crNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  validationDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  registrationDocUrl!: string | null;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  verificationStatus!: 'pending' | 'approved' | 'rejected';

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

  @ApiProperty()
  updatedAt!: string;
}

export class OnboardingStatusDto {
  @ApiProperty()
  isProfileComplete!: boolean;

  @ApiPropertyOptional({ enum: ['reviewer', 'company'], nullable: true })
  accountType!: 'reviewer' | 'company' | null;

  @ApiPropertyOptional({ type: ReviewerProfileDto, nullable: true })
  reviewerProfile!: ReviewerProfileDto | null;

  @ApiPropertyOptional({ type: CompanyProfileDetailDto, nullable: true })
  company!: CompanyProfileDetailDto | null;
}

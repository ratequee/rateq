import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@rateq/types';

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty()
  reviewCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserProfileDto] })
  data!: UserProfileDto[];

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

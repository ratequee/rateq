import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@rateq/types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

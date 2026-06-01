import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@rateq/types';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

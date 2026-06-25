import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminPermission, UserRole } from '@rateq/types';
import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: AdminPermission, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  adminPermissions?: AdminPermission[];

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

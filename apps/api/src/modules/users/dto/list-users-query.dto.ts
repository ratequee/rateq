import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@rateq/types';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Parse query booleans safely. With `enableImplicitConversion`, Nest can turn the
 * string "false" into boolean `true` via Boolean("false") — always read the raw
 * query value from `obj[key]` first.
 */
const toBoolean = ({ obj, key, value }: TransformFnParams): boolean | undefined => {
  const raw = (obj as Record<string, unknown> | undefined)?.[key] ?? value;
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (raw === true || raw === 'true' || raw === '1' || raw === 1) return true;
  if (raw === false || raw === 'false' || raw === '0' || raw === 0) return false;
  return undefined;
};

export class ListUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Exclude admin accounts from results' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  excludeAdmins?: boolean;

  @ApiPropertyOptional({
    description:
      'When true, only users who own a company. When false, exclude users who own a company.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  ownsCompany?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Search by email (partial match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

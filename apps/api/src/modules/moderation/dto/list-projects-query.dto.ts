import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyProjectStatus } from '@rateq/types';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListProjectsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CompanyProjectStatus })
  @IsOptional()
  @IsEnum(CompanyProjectStatus)
  status?: CompanyProjectStatus;

  @ApiPropertyOptional({
    description: 'Search by project title or company name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

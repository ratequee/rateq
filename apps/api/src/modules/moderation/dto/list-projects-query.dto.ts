import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyProjectStatus } from '@rateq/types';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListProjectsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CompanyProjectStatus })
  @IsOptional()
  @IsEnum(CompanyProjectStatus)
  status?: CompanyProjectStatus;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyCatalogType } from '@rateq/types';
import { IsEnum, IsOptional } from 'class-validator';

export class ListCompanyCatalogQueryDto {
  @ApiPropertyOptional({ enum: ['service', 'activity'] })
  @IsOptional()
  @IsEnum(['service', 'activity'] satisfies CompanyCatalogType[])
  type?: CompanyCatalogType;
}

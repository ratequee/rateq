import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListCompanyVerificationsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ['pending', 'approved', 'rejected', 'revision_requested'],
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'revision_requested'])
  status?: 'pending' | 'approved' | 'rejected' | 'revision_requested';
}

export class UpdateCompanyVerificationDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'revision_requested'] })
  @IsIn(['approved', 'rejected', 'revision_requested'])
  status!: 'approved' | 'rejected' | 'revision_requested';

  @ApiPropertyOptional({
    description: 'Required when status is revision_requested — issues for the company to fix',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  revisionNotes?: string;
}

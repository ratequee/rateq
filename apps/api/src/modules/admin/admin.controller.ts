import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '@rateq/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdminService } from './admin.service';

class AdminListCompaniesQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide admin analytics' })
  getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('companies')
  @ApiOperation({ summary: 'List all companies for admin directory' })
  listCompanies(@Query() query: AdminListCompaniesQueryDto) {
    return this.adminService.listCompanies({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get('users/:id/detail')
  @ApiOperation({ summary: 'Reviewer detail with reviews' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('companies/:id/detail')
  @ApiOperation({ summary: 'Company detail with reviews and replies' })
  getCompanyDetail(@Param('id') id: string) {
    return this.adminService.getCompanyDetail(id);
  }
}

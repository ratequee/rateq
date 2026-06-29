import { Controller, Get, Param, Patch, Query, UseGuards, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminPermission, UserRole } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdminActivityService } from '../admin-activity/admin-activity.service';
import { AdminService } from './admin.service';

class AdminListCompaniesQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

class UpdateCompanyStampDto {
  @IsBoolean()
  showVerifiedStamp!: boolean;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(AdminPermissionGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminActivityService: AdminActivityService,
  ) {}

  @Get('stats')
  @RequireAdminPermission(AdminPermission.STATS)
  @ApiOperation({ summary: 'Platform-wide admin analytics' })
  getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('companies')
  @RequireAdminPermission(AdminPermission.DIRECTORY)
  @ApiOperation({ summary: 'List all companies for admin directory' })
  listCompanies(@Query() query: AdminListCompaniesQueryDto) {
    return this.adminService.listCompanies({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get('users/:id/detail')
  @RequireAdminPermission(AdminPermission.DIRECTORY)
  @ApiOperation({ summary: 'Reviewer detail with reviews' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('companies/:id/detail')
  @RequireAdminPermission(AdminPermission.DIRECTORY)
  @ApiOperation({ summary: 'Company detail with reviews and replies' })
  getCompanyDetail(@Param('id') id: string) {
    return this.adminService.getCompanyDetail(id);
  }

  @Patch('companies/:id/stamp')
  @RequireAdminPermission(AdminPermission.DIRECTORY)
  @ApiOperation({ summary: 'Toggle verified stamp visibility on company profile' })
  setCompanyStamp(@Param('id') id: string, @Body() dto: UpdateCompanyStampDto) {
    return this.adminService.setCompanyVerifiedStamp(id, dto.showVerifiedStamp);
  }

  @Get('team')
  @RequireAdminPermission(AdminPermission.TEAM)
  @ApiOperation({ summary: 'List admin team members and their permissions' })
  listTeam() {
    return this.adminService.listTeamMembers();
  }

  @Get('activity')
  @RequireAdminPermission(AdminPermission.TEAM)
  @ApiOperation({ summary: 'List recent admin actions for audit (team managers only)' })
  listActivity(@Query() query: PaginationDto) {
    return this.adminActivityService.list(query.page, query.limit);
  }
}

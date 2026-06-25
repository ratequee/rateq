import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { AdminPermission } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { CompaniesService } from './companies.service';
import {
  ListCompanyVerificationsQueryDto,
  UpdateCompanyVerificationDto,
} from './dto/admin-company-verification.dto';

@ApiTags('admin-companies')
@ApiBearerAuth()
@Controller('admin/companies')
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.COMPANIES)
export class AdminCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('verifications')
  @ApiOperation({ summary: 'List company profile verification requests (Firebase admin)' })
  listVerifications(@Query() query: ListCompanyVerificationsQueryDto) {
    return this.companiesService.listAdminVerifications({
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('verifications/:id')
  @ApiOperation({ summary: 'Get company verification details and documents (Firebase admin)' })
  getVerification(@Param('id') id: string) {
    return this.companiesService.getAdminVerificationDetail(id);
  }

  @Patch('verifications/:id')
  @ApiOperation({ summary: 'Approve or reject a company profile (Firebase admin)' })
  updateVerification(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyVerificationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.companiesService.setAdminVerificationStatus(id, dto, admin.id);
  }

  @Get('profile-changes')
  @ApiOperation({ summary: 'List companies with pending profile change requests' })
  listProfileChanges() {
    return this.companiesService.listAdminProfileChanges();
  }

  @Patch(':id/profile-changes/approve')
  @ApiOperation({ summary: 'Approve pending profile changes for an approved company' })
  approveProfileChanges(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.companiesService.approveProfileChanges(id, admin.id);
  }

  @Patch(':id/profile-changes/reject')
  @ApiOperation({ summary: 'Reject pending profile changes for an approved company' })
  rejectProfileChanges(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.companiesService.rejectProfileChanges(id, admin.id);
  }
}

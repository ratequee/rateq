import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAdminGuard } from '../auth/guards/firebase-admin.guard';
import { CompaniesService } from './companies.service';
import {
  ListCompanyVerificationsQueryDto,
  UpdateCompanyVerificationDto,
} from './dto/admin-company-verification.dto';

@ApiTags('admin-companies')
@ApiBearerAuth()
@Controller('admin/companies')
@UseGuards(FirebaseAdminGuard)
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
  updateVerification(@Param('id') id: string, @Body() dto: UpdateCompanyVerificationDto) {
    return this.companiesService.setAdminVerificationStatus(id, dto);
  }
}

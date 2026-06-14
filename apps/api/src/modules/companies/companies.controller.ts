import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SearchCompaniesQueryDto } from './dto/search-companies-query.dto';
import {
  CompanyDashboardDto,
  CompanyDetailDto,
  CompanyPublicDto,
  PaginatedCompaniesDto,
} from './dto/company-response.dto';
import { RecordPageViewDto } from './dto/record-page-view.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search companies with filters and pagination' })
  @ApiResponse({ status: 200, type: PaginatedCompaniesDto })
  search(@Query() query: SearchCompaniesQueryDto) {
    return this.companiesService.search(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a company profile (onboarding)' })
  @ApiResponse({ status: 201, type: CompanyDetailDto })
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCompanyDto) {
    return this.companiesService.register(user, dto);
  }

  @Get('me/profile')
  @ApiBearerAuth()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get owned company profile' })
  @ApiResponse({ status: 200, type: CompanyDetailDto })
  getMyCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.getMyCompany(user.id);
  }

  @Get('me/dashboard')
  @ApiBearerAuth()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Company dashboard with review stats' })
  @ApiResponse({ status: 200, type: CompanyDashboardDto })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.getDashboard(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update owned company profile' })
  @ApiResponse({ status: 200, type: CompanyDetailDto })
  updateMyCompany(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateMyCompany(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update any company (admin)' })
  @ApiResponse({ status: 200, type: CompanyDetailDto })
  adminUpdate(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete company (admin)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  adminDelete(@Param('id') id: string) {
    return this.companiesService.adminDelete(id);
  }

  @Public()
  @Post(':slug/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a public company profile page view' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  recordPageView(
    @Param('slug') slug: string,
    @Body() dto: RecordPageViewDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.companiesService.recordPageView(slug, dto.visitorId, user?.id);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get public company profile by slug (SEO-friendly)' })
  @ApiResponse({ status: 200, type: CompanyPublicDto })
  getBySlug(@Param('slug') slug: string) {
    return this.companiesService.getPublicProfile(slug);
  }
}

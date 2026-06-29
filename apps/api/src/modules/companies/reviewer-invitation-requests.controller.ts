import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateReviewerInvitationRequestDto } from './dto/create-reviewer-invitation-request.dto';
import { ReviewerInvitationRequestsService } from './reviewer-invitation-requests.service';
import { CompaniesRepository } from './repositories/companies.repository';
import { NotFoundException } from '@nestjs/common';

@ApiTags('reviewer-invitation-requests')
@ApiBearerAuth()
@Controller('companies/me/reviewer-invitation-requests')
@Roles(UserRole.COMPANY)
export class ReviewerInvitationRequestsController {
  constructor(
    private readonly requestsService: ReviewerInvitationRequestsService,
    private readonly companiesRepository: CompaniesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List reviewer invitation requests for owned company' })
  async list(@CurrentUser() user: AuthenticatedUser) {
    const company = await this.companiesRepository.findByOwnerId(user.id);
    if (!company) throw new NotFoundException('No company profile found');
    return this.requestsService.listForCompany(user.id, company.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a reviewer invitation request for admin approval' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewerInvitationRequestDto,
  ) {
    const company = await this.companiesRepository.findByOwnerId(user.id);
    if (!company) throw new NotFoundException('No company profile found');
    return this.requestsService.submit(user.id, company.id, dto);
  }
}

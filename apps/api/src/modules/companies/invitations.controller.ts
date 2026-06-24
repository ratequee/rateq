import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { UserRole } from '@rateq/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { InvitationsService } from './invitations.service';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { CompaniesRepository } from './repositories/companies.repository';
import { NotFoundException } from '@nestjs/common';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('companies/me/invitations')
@Roles(UserRole.COMPANY)
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly companiesRepository: CompaniesRepository,
  ) {}

  @Get('reviewers')
  @ApiOperation({ summary: 'List reviewer invitations sent by this company' })
  async listReviewers(@CurrentUser() user: AuthenticatedUser) {
    const company = await this.companiesRepository.findByOwnerId(user.id);
    if (!company) throw new NotFoundException('No company profile found');
    return this.invitationsService.listCompanyInvitations(company.id, user.id);
  }

  @Post('reviewers')
  @ApiOperation({ summary: 'Invite a reviewer by email' })
  async inviteReviewer(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendInvitationDto) {
    const company = await this.companiesRepository.findByOwnerId(user.id);
    if (!company) throw new NotFoundException('No company profile found');
    return this.invitationsService.inviteReviewer(user.id, company.id, dto.email);
  }
}

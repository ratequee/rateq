import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@rateq/types';
import { InvitationsService } from './invitations.service';
import { SendInvitationDto } from './dto/send-invitation.dto';

@ApiTags('admin-invitations')
@ApiBearerAuth()
@Controller('admin/invitations')
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.INVITATIONS)
export class AdminInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('company')
  @ApiOperation({ summary: 'Invite a company owner by email' })
  inviteCompany(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendInvitationDto) {
    return this.invitationsService.inviteCompany(user.id, dto.email);
  }
}

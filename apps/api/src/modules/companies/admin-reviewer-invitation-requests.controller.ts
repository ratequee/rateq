import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { AdminPermission, UserRole } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { ReviewerInvitationRequestsService } from './reviewer-invitation-requests.service';

@ApiTags('admin-reviewer-invitation-requests')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.MODERATION)
@Controller('admin/reviewer-invitation-requests')
export class AdminReviewerInvitationRequestsController {
  constructor(private readonly requestsService: ReviewerInvitationRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List pending reviewer invitation requests' })
  listPending() {
    return this.requestsService.listPending();
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve invitation request and send invite email' })
  approve(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.requestsService.approve(id, admin.id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject invitation request and notify company' })
  reject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.requestsService.reject(id, admin.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete invitation request and notify company' })
  remove(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.requestsService.remove(id, admin.id);
  }
}

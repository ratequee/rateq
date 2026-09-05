import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@rateq/types';
import { AdminPermission, UserRole } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ModerationService } from './moderation.service';

@ApiTags('moderation-projects')
@ApiBearerAuth()
@Controller('moderation')
@Roles(UserRole.ADMIN)
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.PROJECTS)
export class ModerationProjectsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('projects')
  @ApiOperation({ summary: 'List company projects for admin moderation' })
  listProjects(@Query() query: ListProjectsQueryDto) {
    return this.moderationService.listProjects(query);
  }

  @Patch('projects/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending company project' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async approveProject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualApproveProject(id, admin.id);
    return { message: 'Project approved' };
  }

  @Patch('projects/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending company project' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async rejectProject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualRejectProject(id, admin.id);
    return { message: 'Project rejected' };
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a company project' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteProject(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    await this.moderationService.manualDeleteProject(id, admin.id);
    return { message: 'Project deleted' };
  }
}

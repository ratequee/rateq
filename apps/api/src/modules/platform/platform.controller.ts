import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission, UserRole } from '@rateq/types';
import { Public } from '../../common/decorators/public.decorator';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Public platform statistics' })
  getStats() {
    return this.platformService.getPublicStats();
  }

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Public site settings (footer contact info)' })
  getSettings() {
    return this.platformService.getSiteSettings();
  }
}

@ApiTags('admin-settings')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.CONTENT)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  @ApiOperation({ summary: 'Get site settings for admin editing' })
  getSettings() {
    return this.platformService.getSiteSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update site settings (footer contact info)' })
  updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    return this.platformService.updateSiteSettings(dto);
  }
}

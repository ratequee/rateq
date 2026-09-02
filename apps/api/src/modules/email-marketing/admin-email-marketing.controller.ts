import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@rateq/types';
import { RequireAdminPermission } from '../../common/decorators/require-admin-permission.decorator';
import { AdminPermissionGuard } from '../auth/guards/admin-permission.guard';
import { SendMarketingEmailDto } from './dto/send-marketing-email.dto';
import { EmailMarketingService } from './email-marketing.service';

@ApiTags('admin-email-marketing')
@ApiBearerAuth()
@Controller('admin/email-marketing')
@UseGuards(AdminPermissionGuard)
@RequireAdminPermission(AdminPermission.EMAIL_MARKETING)
export class AdminEmailMarketingController {
  constructor(private readonly emailMarketingService: EmailMarketingService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a marketing email campaign to a list of recipients' })
  send(@Body() dto: SendMarketingEmailDto) {
    return this.emailMarketingService.sendCampaign(dto);
  }
}

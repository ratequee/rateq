import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PlatformService } from './platform.service';
import { PlatformStatsDto } from './dto/platform-stats.dto';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Public platform statistics' })
  @ApiResponse({ status: 200, type: PlatformStatsDto })
  getStats() {
    return this.platformService.getPublicStats();
  }
}

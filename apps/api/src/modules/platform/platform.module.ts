import { Module } from '@nestjs/common';
import { AdminSettingsController, PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  controllers: [PlatformController, AdminSettingsController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}

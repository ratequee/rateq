import { Module } from '@nestjs/common';
import { EmailModule } from '../auth/email.module';
import { AdminEmailMarketingController } from './admin-email-marketing.controller';
import { EmailMarketingService } from './email-marketing.service';

@Module({
  imports: [EmailModule],
  controllers: [AdminEmailMarketingController],
  providers: [EmailMarketingService],
})
export class EmailMarketingModule {}

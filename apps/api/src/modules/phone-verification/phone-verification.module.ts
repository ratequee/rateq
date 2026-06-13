import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { WhatsAppService } from '../auth/services/whatsapp.service';
import { PhoneOtpService } from './phone-otp.service';

@Module({
  imports: [RedisModule, DatabaseModule],
  providers: [WhatsAppService, PhoneOtpService],
  exports: [PhoneOtpService],
})
export class PhoneVerificationModule {}

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import type { MessageResponse } from '@rateq/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { AppConfig } from '../../common/config/env.validation';
import { hashToken, verifyTokenHash } from '../auth/utils/token-hash.util';
import { WhatsAppService } from '../auth/services/whatsapp.service';

export type PhoneVerificationContext = 'reviewer' | 'company';

interface PhoneOtpSession {
  phone: string;
  otpHash: string;
  verified: boolean;
}

const SESSION_PREFIX = 'phone-otp:';

@Injectable()
export class PhoneOtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly whatsAppService: WhatsAppService,
    private readonly prisma: PrismaService,
  ) {}

  private get ttlSeconds(): number {
    return this.configService.get('AUTH_PHONE_OTP_TTL_SECONDS', { infer: true });
  }

  private sessionKey(userId: string, context: PhoneVerificationContext): string {
    return `${SESSION_PREFIX}${userId}:${context}`;
  }

  generateOtp(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  async sendOtp(
    userId: string,
    phone: string,
    context: PhoneVerificationContext,
  ): Promise<MessageResponse> {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      throw new BadRequestException('Phone number is required');
    }

    const otp = this.generateOtp();
    const session: PhoneOtpSession = {
      phone: normalizedPhone,
      otpHash: hashToken(otp),
      verified: false,
    };

    await this.redis
      .getClient()
      .setex(this.sessionKey(userId, context), this.ttlSeconds, JSON.stringify(session));

    await this.whatsAppService.sendOtp(normalizedPhone, otp);

    return { message: 'Verification code sent to your WhatsApp' };
  }

  async verifyOtp(
    userId: string,
    code: string,
    context: PhoneVerificationContext,
  ): Promise<MessageResponse> {
    const raw = await this.redis.getClient().get(this.sessionKey(userId, context));
    if (!raw) {
      throw new BadRequestException('Verification session expired. Please request a new code.');
    }

    const session = JSON.parse(raw) as PhoneOtpSession;

    if (!verifyTokenHash(code.trim(), session.otpHash)) {
      throw new BadRequestException('Invalid verification code');
    }

    session.verified = true;
    await this.redis
      .getClient()
      .setex(this.sessionKey(userId, context), this.ttlSeconds, JSON.stringify(session));

    if (context === 'reviewer') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: session.phone, phoneVerified: true },
      });
    }

    return { message: 'Phone number verified successfully' };
  }

  async assertPhoneVerified(
    userId: string,
    phone: string,
    context: PhoneVerificationContext,
  ): Promise<void> {
    const normalizedPhone = phone.trim();

    if (context === 'reviewer') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.phoneVerified || !user.phone || user.phone.trim() !== normalizedPhone) {
        throw new BadRequestException(
          'Verify your phone number via WhatsApp before completing your profile',
        );
      }
      return;
    }

    const raw = await this.redis.getClient().get(this.sessionKey(userId, context));
    if (!raw) {
      throw new BadRequestException(
        'Verify your company phone number via WhatsApp before submitting',
      );
    }

    const session = JSON.parse(raw) as PhoneOtpSession;
    if (!session.verified || session.phone.trim() !== normalizedPhone) {
      throw new BadRequestException(
        'Verify your company phone number via WhatsApp before submitting',
      );
    }
  }

  async clearSession(userId: string, context: PhoneVerificationContext): Promise<void> {
    await this.redis.getClient().del(this.sessionKey(userId, context));
  }
}

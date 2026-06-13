import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MessageResponse } from '@rateq/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { AppConfig } from '../../common/config/env.validation';
import { FirebaseAdminService } from '../auth/services/firebase-admin.service';

export type PhoneVerificationContext = 'reviewer' | 'company';

interface PhoneVerificationSession {
  phone: string;
  verified: boolean;
}

const SESSION_PREFIX = 'phone-otp:';

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  return `+${digits.replace(/^\+/, '')}`;
}

function phonesMatch(left: string, right: string): boolean {
  return normalizePhone(left) === normalizePhone(right);
}

@Injectable()
export class PhoneOtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  private get ttlSeconds(): number {
    return this.configService.get('AUTH_PHONE_OTP_TTL_SECONDS', { infer: true });
  }

  private sessionKey(userId: string, context: PhoneVerificationContext): string {
    return `${SESSION_PREFIX}${userId}:${context}`;
  }

  async syncVerifiedPhone(
    userId: string,
    phone: string,
    context: PhoneVerificationContext,
  ): Promise<MessageResponse> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      throw new BadRequestException('Phone number is required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.firebaseUid) {
      throw new BadRequestException('Sign in with Firebase before verifying your phone number');
    }

    const firebasePhone = await this.firebaseAdmin.getVerifiedPhoneNumber(user.firebaseUid);
    if (!firebasePhone || !phonesMatch(firebasePhone, normalizedPhone)) {
      throw new BadRequestException(
        'Phone number is not verified in Firebase. Complete SMS verification first.',
      );
    }

    const session: PhoneVerificationSession = {
      phone: normalizedPhone,
      verified: true,
    };

    await this.redis
      .getClient()
      .setex(this.sessionKey(userId, context), this.ttlSeconds, JSON.stringify(session));

    if (context === 'reviewer') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: normalizedPhone, phoneVerified: true },
      });
    }

    return { message: 'Phone number verified successfully' };
  }

  async assertPhoneVerified(
    userId: string,
    phone: string,
    context: PhoneVerificationContext,
  ): Promise<void> {
    const normalizedPhone = normalizePhone(phone);

    if (context === 'reviewer') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.phoneVerified || !user.phone || !phonesMatch(user.phone, normalizedPhone)) {
        throw new BadRequestException(
          'Verify your phone number via SMS before completing your profile',
        );
      }
      return;
    }

    const raw = await this.redis.getClient().get(this.sessionKey(userId, context));
    if (!raw) {
      throw new BadRequestException('Verify your company phone number via SMS before submitting');
    }

    const session = JSON.parse(raw) as PhoneVerificationSession;
    if (!session.verified || !phonesMatch(session.phone, normalizedPhone)) {
      throw new BadRequestException('Verify your company phone number via SMS before submitting');
    }
  }

  async clearSession(userId: string, context: PhoneVerificationContext): Promise<void> {
    await this.redis.getClient().del(this.sessionKey(userId, context));
  }
}

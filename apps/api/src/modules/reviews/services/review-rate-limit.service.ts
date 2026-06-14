import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../common/config/env.validation';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@Injectable()
export class ReviewRateLimitService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async assertWithinLimit(userId: string, hashedIp?: string | null): Promise<void> {
    await this.checkLimit(`rate:review:user:${userId}`);

    if (hashedIp) {
      await this.checkLimit(`rate:review:ip:${hashedIp}`);
    }
  }

  private async checkLimit(key: string): Promise<void> {
    const ttl = this.configService.get('RATE_LIMIT_REVIEW_TTL', { infer: true });
    const max = this.configService.get('RATE_LIMIT_REVIEW_MAX', { infer: true });

    const client = this.redis.getClient();
    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, ttl);
    }

    if (count > max) {
      throw new HttpException(
        'Too many reviews submitted. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

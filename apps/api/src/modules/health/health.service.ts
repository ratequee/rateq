import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [database, redis] = await Promise.all([
      this.pingDatabase(),
      this.pingRedis(),
    ]);

    const allUp = database === 'up' && redis === 'up';

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database, redis },
    };
  }

  private async pingDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async pingRedis(): Promise<'up' | 'down'> {
    try {
      const result = await this.redis.getClient().ping();
      return result === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}

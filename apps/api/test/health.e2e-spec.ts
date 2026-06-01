import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../src/modules/health/health.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };
  let redis: { getClient: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = {
      getClient: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue('PONG'),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('reports ok when database and redis are up', async () => {
    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('up');
    expect(result.services.redis).toBe('up');
  });

  it('reports degraded when database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database).toBe('down');
  });
});

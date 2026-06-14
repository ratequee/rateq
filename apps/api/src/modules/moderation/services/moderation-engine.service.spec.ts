import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsRepository } from '../../reviews/repositories/reviews.repository';
import { ModerationEngineService, type ModerationContext } from './moderation-engine.service';
import { mockConfigService } from '../../../../test/helpers/mock-config';

describe('ModerationEngineService', () => {
  let service: ModerationEngineService;
  let reviewsRepository: {
    countReviewsOnCompanySince: jest.Mock;
    countByHashedIpOnCompany: jest.Mock;
    countByFingerprintOnCompany: jest.Mock;
    findRecentByCompany: jest.Mock;
  };

  const baseContext: ModerationContext = {
    reviewId: 'review-1',
    userId: 'user-1',
    companyId: 'company-1',
    title: 'Great service',
    content: 'Very professional team with excellent support throughout.',
    hashedIp: null,
    deviceFingerprint: null,
    userCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    reviewsRepository = {
      countReviewsOnCompanySince: jest.fn().mockResolvedValue(0),
      countByHashedIpOnCompany: jest.fn().mockResolvedValue(0),
      countByFingerprintOnCompany: jest.fn().mockResolvedValue(0),
      findRecentByCompany: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationEngineService,
        { provide: ConfigService, useValue: mockConfigService() },
        { provide: ReviewsRepository, useValue: reviewsRepository },
      ],
    }).compile();

    service = module.get(ModerationEngineService);
  });

  it('returns zero scores for trusted reviewer with unique content', async () => {
    const result = await service.evaluate(baseContext);

    expect(result).toEqual({
      newAccount: 0,
      velocity: 0,
      ipHash: 0,
      fingerprint: 0,
      similarity: 0,
      total: 0,
    });
    expect(service.shouldQueue(result)).toBe(false);
  });

  it('adds new account score for accounts younger than threshold', async () => {
    const result = await service.evaluate({
      ...baseContext,
      userCreatedAt: new Date(),
    });

    expect(result.newAccount).toBe(2);
    expect(result.total).toBe(2);
    expect(service.shouldQueue(result)).toBe(false);
  });

  it('adds company velocity score when review count exceeds threshold', async () => {
    reviewsRepository.countReviewsOnCompanySince.mockResolvedValue(10);

    const result = await service.evaluate(baseContext);

    expect(result.velocity).toBe(3);
    expect(service.shouldQueue(result)).toBe(false);
  });

  it('adds ip hash score when duplicate ip on same company', async () => {
    reviewsRepository.countByHashedIpOnCompany.mockResolvedValue(1);

    const result = await service.evaluate({
      ...baseContext,
      hashedIp: 'hashed-ip-abc',
    });

    expect(result.ipHash).toBe(2);
  });

  it('adds fingerprint score when duplicate device on same company', async () => {
    reviewsRepository.countByFingerprintOnCompany.mockResolvedValue(1);

    const result = await service.evaluate({
      ...baseContext,
      deviceFingerprint: 'fp-123',
    });

    expect(result.fingerprint).toBe(2);
  });

  it('adds similarity score for near-duplicate reviews', async () => {
    reviewsRepository.findRecentByCompany.mockResolvedValue([
      {
        id: 'other',
        title: 'Great service',
        content: 'Very professional team with excellent support throughout!',
      },
    ]);

    const result = await service.evaluate(baseContext);

    expect(result.similarity).toBe(3);
  });

  it('queues review when total score meets threshold', async () => {
    reviewsRepository.countReviewsOnCompanySince.mockResolvedValue(10);

    const result = await service.evaluate({
      ...baseContext,
      userCreatedAt: new Date(),
    });

    expect(result.total).toBeGreaterThanOrEqual(5);
    expect(service.shouldQueue(result)).toBe(true);
  });

  it('buildReasonLog lists triggered signals', () => {
    const reasons = service.buildReasonLog(
      { newAccount: 2, velocity: 3, ipHash: 0, fingerprint: 0, similarity: 0, total: 5 },
      0.9,
    );

    expect(reasons).toContain('new_account');
    expect(reasons).toContain('high_company_velocity');
  });

  it('buildReasonLog returns passed_checks when no signals', () => {
    expect(
      service.buildReasonLog({
        newAccount: 0,
        velocity: 0,
        ipHash: 0,
        fingerprint: 0,
        similarity: 0,
        total: 0,
      }),
    ).toEqual(['passed_checks']);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ModerationAction } from '@prisma/client';
import { EmailService } from '../auth/services/email.service';
import { ReviewsRepository } from '../reviews/repositories/reviews.repository';
import { ModerationService } from './moderation.service';
import { ModerationRepository } from './repositories/moderation.repository';
import { ModerationEngineService } from './services/moderation-engine.service';

describe('ModerationService', () => {
  let service: ModerationService;
  let reviewsRepository: {
    findById: jest.Mock;
    updateModerationResult: jest.Mock;
    recalculateCompanyRating: jest.Mock;
    incrementUserReviewCount: jest.Mock;
  };
  let moderationRepository: { createLog: jest.Mock };
  let moderationEngine: {
    evaluate: jest.Mock;
    getMaxSimilarity: jest.Mock;
    buildReasonLog: jest.Mock;
    shouldQueue: jest.Mock;
  };

  const zeroBreakdown = {
    newAccount: 0,
    velocity: 0,
    ipHash: 0,
    fingerprint: 0,
    similarity: 0,
    total: 0,
  };

  const baseReview = {
    id: 'review-1',
    userId: 'user-1',
    companyId: 'company-1',
    title: 'Poor experience',
    content: 'Not satisfied with the service.',
    status: 'PENDING',
    hashedIp: null,
    deviceFingerprint: null,
    moderationScore: null,
    user: { createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), email: 'user@example.com' },
    company: { name: 'Test Co' },
  };

  beforeEach(async () => {
    reviewsRepository = {
      findById: jest.fn(),
      updateModerationResult: jest.fn().mockResolvedValue(undefined),
      recalculateCompanyRating: jest.fn().mockResolvedValue(undefined),
      incrementUserReviewCount: jest.fn().mockResolvedValue(undefined),
    };

    moderationRepository = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    moderationEngine = {
      evaluate: jest.fn().mockResolvedValue(zeroBreakdown),
      getMaxSimilarity: jest.fn().mockResolvedValue(0),
      buildReasonLog: jest.fn().mockReturnValue(['passed_checks']),
      shouldQueue: jest.fn().mockReturnValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: ReviewsRepository, useValue: reviewsRepository },
        { provide: ModerationRepository, useValue: moderationRepository },
        { provide: ModerationEngineService, useValue: moderationEngine },
        {
          provide: EmailService,
          useValue: { sendReviewApprovedEmail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(ModerationService);
  });

  it('holds negative reviews (3 stars or below) for admin even with a low moderation score', async () => {
    reviewsRepository.findById.mockResolvedValue({ ...baseReview, rating: 2 });

    await service.processReview('review-1');

    expect(reviewsRepository.updateModerationResult).toHaveBeenCalledWith('review-1', {
      status: 'PENDING',
      moderationScore: 0,
      similarityScore: undefined,
    });
    expect(moderationRepository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewId: 'review-1',
        reason: 'negative_rating, passed_checks',
        action: ModerationAction.FLAGGED,
      }),
    );
    expect(reviewsRepository.recalculateCompanyRating).not.toHaveBeenCalled();
  });

  it('auto-approves positive reviews (4+ stars) when moderation score is below threshold', async () => {
    reviewsRepository.findById.mockResolvedValue({ ...baseReview, rating: 5, title: 'Great' });

    await service.processReview('review-1');

    expect(reviewsRepository.updateModerationResult).toHaveBeenCalledWith('review-1', {
      status: 'APPROVED',
      moderationScore: 0,
      similarityScore: undefined,
    });
    expect(moderationRepository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ModerationAction.AUTO_APPROVED,
      }),
    );
    expect(reviewsRepository.recalculateCompanyRating).toHaveBeenCalledWith('company-1');
  });
});

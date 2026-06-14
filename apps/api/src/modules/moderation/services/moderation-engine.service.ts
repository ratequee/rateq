import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ModerationScoreBreakdown } from '@rateq/types';
import { textSimilarityRatio } from '@rateq/utils';
import type { AppConfig } from '../../../common/config/env.validation';
import { ReviewsRepository } from '../../reviews/repositories/reviews.repository';

export interface ModerationContext {
  reviewId: string;
  userId: string;
  companyId: string;
  content: string;
  title: string;
  hashedIp?: string | null;
  deviceFingerprint?: string | null;
  userCreatedAt: Date;
}

@Injectable()
export class ModerationEngineService {
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly reviewsRepository: ReviewsRepository,
  ) {}

  async evaluate(context: ModerationContext): Promise<ModerationScoreBreakdown> {
    const [newAccount, velocity, ipHash, fingerprint, similarityResult] = await Promise.all([
      Promise.resolve(this.scoreNewAccount(context.userCreatedAt)),
      this.scoreCompanyVelocity(context),
      this.scoreIpHash(context),
      this.scoreFingerprint(context),
      this.computeSimilarity(context),
    ]);

    return {
      newAccount,
      velocity,
      ipHash,
      fingerprint,
      similarity: similarityResult.score,
      total: newAccount + velocity + ipHash + fingerprint + similarityResult.score,
    };
  }

  shouldQueue(breakdown: ModerationScoreBreakdown): boolean {
    const threshold = this.configService.get('MODERATION_SCORE_THRESHOLD', { infer: true });
    return breakdown.total >= threshold;
  }

  private scoreNewAccount(userCreatedAt: Date): number {
    const days = this.configService.get('MODERATION_NEW_ACCOUNT_DAYS', { infer: true });
    const score = this.configService.get('MODERATION_NEW_ACCOUNT_SCORE', { infer: true });
    const accountAgeMs = Date.now() - userCreatedAt.getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    return accountAgeDays < days ? score : 0;
  }

  /** 10+ reviews on the same company within the configured window → hold. */
  private async scoreCompanyVelocity(context: ModerationContext): Promise<number> {
    const windowHours = this.configService.get('MODERATION_VELOCITY_WINDOW_HOURS', {
      infer: true,
    });
    const threshold = this.configService.get('MODERATION_VELOCITY_THRESHOLD', { infer: true });
    const score = this.configService.get('MODERATION_VELOCITY_SCORE', { infer: true });

    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const count = await this.reviewsRepository.countReviewsOnCompanySince(
      context.companyId,
      since,
      context.reviewId,
    );

    return count >= threshold ? score : 0;
  }

  private async scoreIpHash(context: ModerationContext): Promise<number> {
    if (!context.hashedIp) {
      return 0;
    }

    const lookbackDays = this.configService.get('MODERATION_IP_LOOKBACK_DAYS', { infer: true });
    const score = this.configService.get('MODERATION_IP_HASH_SCORE', { infer: true });
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const count = await this.reviewsRepository.countByHashedIpOnCompany(
      context.companyId,
      context.hashedIp,
      since,
      context.reviewId,
    );

    return count > 0 ? score : 0;
  }

  private async scoreFingerprint(context: ModerationContext): Promise<number> {
    if (!context.deviceFingerprint) {
      return 0;
    }

    const lookbackDays = this.configService.get('MODERATION_SIMILARITY_LOOKBACK_DAYS', {
      infer: true,
    });
    const score = this.configService.get('MODERATION_FINGERPRINT_SCORE', { infer: true });
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const count = await this.reviewsRepository.countByFingerprintOnCompany(
      context.companyId,
      context.deviceFingerprint,
      since,
      context.reviewId,
    );

    return count > 0 ? score : 0;
  }

  private async computeSimilarity(
    context: ModerationContext,
  ): Promise<{ score: number; maxSimilarity: number }> {
    const lookbackDays = this.configService.get('MODERATION_SIMILARITY_LOOKBACK_DAYS', {
      infer: true,
    });
    const threshold = this.configService.get('MODERATION_SIMILARITY_THRESHOLD', {
      infer: true,
    });
    const score = this.configService.get('MODERATION_SIMILARITY_SCORE', { infer: true });

    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const recent = await this.reviewsRepository.findRecentByCompany(
      context.companyId,
      since,
      context.reviewId,
    );

    const combined = `${context.title} ${context.content}`.trim().toLowerCase();
    let maxSimilarity = 0;

    for (const review of recent) {
      const other = `${review.title} ${review.content}`.trim().toLowerCase();
      maxSimilarity = Math.max(maxSimilarity, textSimilarityRatio(combined, other));
    }

    return {
      maxSimilarity,
      score: maxSimilarity >= threshold ? score : 0,
    };
  }

  buildReasonLog(breakdown: ModerationScoreBreakdown, maxSimilarity?: number): string[] {
    const reasons: string[] = [];

    if (breakdown.newAccount > 0) reasons.push('new_account');
    if (breakdown.velocity > 0) reasons.push('high_company_velocity');
    if (breakdown.ipHash > 0) reasons.push('duplicate_ip_hash');
    if (breakdown.fingerprint > 0) reasons.push('duplicate_fingerprint');
    if (breakdown.similarity > 0) {
      reasons.push(
        maxSimilarity !== undefined
          ? `high_text_similarity:${maxSimilarity.toFixed(2)}`
          : 'high_text_similarity',
      );
    }

    if (reasons.length === 0) {
      reasons.push('passed_checks');
    }

    return reasons;
  }

  async getMaxSimilarity(context: ModerationContext): Promise<number> {
    const result = await this.computeSimilarity(context);
    return result.maxSimilarity;
  }
}

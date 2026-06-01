import { Injectable } from '@nestjs/common';
import type { ModerationAction } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  createLog(data: {
    reviewId: string;
    reason: string;
    score: number;
    action: ModerationAction;
  }) {
    return this.prisma.moderationLog.create({ data });
  }

  findLogsByReviewId(reviewId: string) {
    return this.prisma.moderationLog.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

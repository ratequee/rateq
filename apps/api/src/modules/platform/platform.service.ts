import { Injectable } from '@nestjs/common';
import type { PlatformStats } from '@rateq/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats(): Promise<PlatformStats> {
    const [totalCompanies, totalReviewers, totalReviews] = await Promise.all([
      this.prisma.company.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.user.count({
        where: { role: 'USER', profile: { isNot: null } },
      }),
      this.prisma.review.count({ where: { status: 'APPROVED' } }),
    ]);

    return { totalCompanies, totalReviewers, totalReviews };
  }
}

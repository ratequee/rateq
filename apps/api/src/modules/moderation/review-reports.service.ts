import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import type { ReviewReportStatus as PrismaReviewReportStatus } from '@prisma/client';
import type {
  CreateReviewReportInput,
  PaginatedReviewReportsResponse,
  ReviewReportPublic,
} from '@rateq/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { EmailService } from '../auth/services/email.service';
import { ModerationService } from './moderation.service';
import { toReviewPublic } from '../reviews/mappers/review.mapper';

@Injectable()
export class ReviewReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ModerationService))
    private readonly moderationService: ModerationService,
    private readonly emailService: EmailService,
  ) {}

  async submit(
    reporterId: string,
    reviewId: string,
    input: CreateReviewReportInput,
  ): Promise<ReviewReportPublic> {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId === reporterId) {
      throw new BadRequestException('You cannot report your own review');
    }

    if (review.status !== 'APPROVED') {
      throw new BadRequestException('Only published reviews can be reported');
    }

    const existing = await this.prisma.reviewReport.findFirst({
      where: { reviewId, reporterId, status: 'PENDING' },
    });

    if (existing) {
      throw new ConflictException('You already have a pending report for this review');
    }

    const report = await this.prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason: input.reason?.trim() || null,
      },
    });

    return this.toPublic(report);
  }

  async listPending(page: number, limit: number): Promise<PaginatedReviewReportsResponse> {
    const [reports, total] = await Promise.all([
      this.prisma.reviewReport.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          review: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  phone: true,
                  phoneVerified: true,
                  createdAt: true,
                  profile: { select: { fullName: true, avatarUrl: true, phone: true } },
                },
              },
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                  categoryId: true,
                  email: true,
                  category: { select: { id: true, nameEn: true, nameAr: true } },
                },
              },
              replies: true,
              attachments: true,
            },
          },
          reporter: { select: { email: true } },
        },
      }),
      this.prisma.reviewReport.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      data: reports.map((report) => this.toPublic(report, report.review, report.reporter.email)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async approve(reportId: string, adminId: string): Promise<ReviewReportPublic> {
    const report = await this.getPendingReport(reportId);
    const reporterEmail = report.reporter.email;
    const companyName = report.review.company.name;

    await this.moderationService.manualDelete(report.reviewId, adminId);

    const updated = await this.prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
        resolvedById: adminId,
      },
    });

    try {
      await this.emailService.sendReviewReportApprovedEmail({
        email: reporterEmail,
        companyName,
      });
    } catch {
      // non-blocking
    }

    return this.toPublic(updated);
  }

  async reject(reportId: string, adminId: string): Promise<ReviewReportPublic> {
    const report = await this.getPendingReport(reportId);
    const reporterEmail = report.reporter.email;
    const companyName = report.review.company.name;

    const updated = await this.prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        resolvedById: adminId,
      },
    });

    try {
      await this.emailService.sendReviewReportRejectedEmail({
        email: reporterEmail,
        companyName,
      });
    } catch {
      // non-blocking
    }

    return this.toPublic(updated);
  }

  private async getPendingReport(reportId: string) {
    const report = await this.prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: {
        review: { include: { company: { select: { name: true } } } },
        reporter: { select: { email: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== 'PENDING') {
      throw new BadRequestException('Report has already been resolved');
    }

    return report;
  }

  private toPublic(
    report: {
      id: string;
      reviewId: string;
      reporterId: string;
      reason: string | null;
      status: PrismaReviewReportStatus;
      createdAt: Date;
      resolvedAt: Date | null;
    },
    review?: Parameters<typeof toReviewPublic>[0],
    reporterEmail?: string,
  ): ReviewReportPublic {
    return {
      id: report.id,
      reviewId: report.reviewId,
      reporterId: report.reporterId,
      reason: report.reason,
      status: report.status.toLowerCase() as ReviewReportPublic['status'],
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
      ...(review ? { review: toReviewPublic(review, { includeUnpublishedReply: true }) } : {}),
      ...(reporterEmail ? { reporterEmail } : {}),
    };
  }
}

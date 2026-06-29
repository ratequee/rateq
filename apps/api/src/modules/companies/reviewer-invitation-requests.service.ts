import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ReviewerInvitationRequestStatus as PrismaStatus } from '@prisma/client';
import type {
  CreateReviewerInvitationRequestInput,
  ReviewerInvitationRequestPublic,
} from '@rateq/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EmailService } from '../auth/services/email.service';
import { InvitationsService } from './invitations.service';

@Injectable()
export class ReviewerInvitationRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationsService: InvitationsService,
    private readonly emailService: EmailService,
  ) {}

  async submit(
    ownerId: string,
    companyId: string,
    input: CreateReviewerInvitationRequestInput,
  ): Promise<ReviewerInvitationRequestPublic> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!company || company.ownerId !== ownerId) {
      throw new NotFoundException('Company not found');
    }

    const reviewerName = input.reviewerName.trim();
    const email = input.email.trim().toLowerCase();
    const serviceProvided = input.serviceProvided.trim();
    const proofUrls = (input.proofUrls ?? []).filter(Boolean).slice(0, 8);

    if (!reviewerName || !email || !serviceProvided) {
      throw new BadRequestException('Name, email, and service provided are required');
    }

    if (proofUrls.length === 0) {
      throw new BadRequestException('At least one proof file is required');
    }

    const pending = await this.prisma.reviewerInvitationRequest.findFirst({
      where: { companyId, email, status: 'PENDING' },
    });

    if (pending) {
      throw new ConflictException('A pending invitation request already exists for this email');
    }

    const request = await this.prisma.reviewerInvitationRequest.create({
      data: {
        companyId,
        reviewerName,
        email,
        serviceProvided,
        proofUrls,
      },
      include: { company: { select: { name: true } } },
    });

    return this.toPublic(request);
  }

  async listForCompany(
    ownerId: string,
    companyId: string,
  ): Promise<ReviewerInvitationRequestPublic[]> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.ownerId !== ownerId) {
      throw new NotFoundException('Company not found');
    }

    const requests = await this.prisma.reviewerInvitationRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { company: { select: { name: true } } },
    });

    return requests.map((item) => this.toPublic(item));
  }

  async listPending(): Promise<ReviewerInvitationRequestPublic[]> {
    const requests = await this.prisma.reviewerInvitationRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { company: { select: { name: true } } },
    });

    return requests.map((item) => this.toPublic(item));
  }

  async approve(requestId: string, adminId: string): Promise<ReviewerInvitationRequestPublic> {
    const request = await this.getPending(requestId);

    if (!request.company.ownerId) {
      throw new BadRequestException('Company owner is required to send invitations');
    }

    await this.invitationsService.inviteReviewer(
      request.company.ownerId,
      request.companyId,
      request.email,
    );

    const updated = await this.prisma.reviewerInvitationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
        resolvedById: adminId,
      },
      include: { company: { select: { name: true } } },
    });

    return this.toPublic(updated);
  }

  async reject(requestId: string, adminId: string): Promise<ReviewerInvitationRequestPublic> {
    await this.getPending(requestId);

    const updated = await this.prisma.reviewerInvitationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        resolvedById: adminId,
      },
      include: { company: { select: { name: true, owner: { select: { email: true } } } } },
    });

    const ownerEmail = updated.company.owner?.email;
    if (ownerEmail) {
      try {
        await this.emailService.sendReviewerInvitationRejectedEmail({
          email: ownerEmail,
          companyName: updated.company.name,
          reviewerName: updated.reviewerName,
        });
      } catch {
        // non-blocking
      }
    }

    return this.toPublic(updated);
  }

  async remove(requestId: string, _adminId: string): Promise<ReviewerInvitationRequestPublic> {
    const request = await this.prisma.reviewerInvitationRequest.findUnique({
      where: { id: requestId },
      include: {
        company: { select: { name: true, owner: { select: { email: true } } } },
      },
    });

    if (!request) {
      throw new NotFoundException('Invitation request not found');
    }

    const snapshot = this.toPublic(request);

    const ownerEmail = request.company.owner?.email;
    if (ownerEmail) {
      try {
        await this.emailService.sendReviewerInvitationDeletedEmail({
          email: ownerEmail,
          companyName: request.company.name,
          reviewerName: request.reviewerName,
        });
      } catch {
        // non-blocking
      }
    }

    await this.prisma.reviewerInvitationRequest.delete({ where: { id: requestId } });

    return snapshot;
  }

  private async getPending(requestId: string) {
    const request = await this.prisma.reviewerInvitationRequest.findUnique({
      where: { id: requestId },
      include: {
        company: {
          select: { id: true, name: true, ownerId: true, owner: { select: { email: true } } },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Invitation request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Invitation request has already been resolved');
    }

    return request;
  }

  private toPublic(item: {
    id: string;
    companyId: string;
    reviewerName: string;
    email: string;
    serviceProvided: string;
    proofUrls: unknown;
    status: PrismaStatus;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date | null;
    company?: { name: string };
  }): ReviewerInvitationRequestPublic {
    const proofUrls = Array.isArray(item.proofUrls)
      ? item.proofUrls.filter((url): url is string => typeof url === 'string')
      : [];

    return {
      id: item.id,
      companyId: item.companyId,
      companyName: item.company?.name,
      reviewerName: item.reviewerName,
      email: item.email,
      serviceProvided: item.serviceProvided,
      proofUrls,
      status: item.status.toLowerCase() as ReviewerInvitationRequestPublic['status'],
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
    };
  }
}

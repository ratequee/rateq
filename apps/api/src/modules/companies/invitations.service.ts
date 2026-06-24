import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { InvitationPublic, InvitationType } from '@rateq/types';
import { InvitationType as PrismaInvitationType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EmailService } from '../auth/services/email.service';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/env.validation';
import { addHours, generateSecureToken, hashToken } from '../auth/utils/token-hash.util';

const INVITE_EXPIRY_HOURS = 168; // 7 days

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async inviteCompany(invitedById: string, email: string): Promise<InvitationPublic> {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('A user with this email is already registered');
    }

    return this.createInvitation({
      email: normalizedEmail,
      type: 'COMPANY',
      invitedById,
    });
  }

  async inviteReviewer(
    invitedById: string,
    companyId: string,
    email: string,
  ): Promise<InvitationPublic> {
    const normalizedEmail = email.trim().toLowerCase();

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== invitedById) {
      throw new BadRequestException('Only the company owner can invite reviewers');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('A user with this email is already registered');
    }

    return this.createInvitation({
      email: normalizedEmail,
      type: 'REVIEWER',
      invitedById,
      companyId,
      companyName: company.name,
    });
  }

  async listCompanyInvitations(companyId: string, ownerId: string): Promise<InvitationPublic[]> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company || company.ownerId !== ownerId) {
      throw new NotFoundException('Company not found');
    }

    const invitations = await this.prisma.userInvitation.findMany({
      where: { companyId, type: 'REVIEWER' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return invitations.map(toPublic);
  }

  private async createInvitation(input: {
    email: string;
    type: PrismaInvitationType;
    invitedById: string;
    companyId?: string;
    companyName?: string;
  }): Promise<InvitationPublic> {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = addHours(new Date(), INVITE_EXPIRY_HOURS);

    const invitation = await this.prisma.userInvitation.create({
      data: {
        email: input.email,
        type: input.type,
        tokenHash,
        invitedById: input.invitedById,
        companyId: input.companyId ?? null,
        expiresAt,
      },
    });

    const appUrl = this.configService.get('APP_URL', { infer: true });
    const registerUrl = `${appUrl}/register?invite=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(input.email)}`;

    await this.emailService.sendUserInvitationEmail({
      email: input.email,
      registerUrl,
      invitationType: input.type.toLowerCase() as InvitationType,
      companyName: input.companyName,
    });

    return toPublic(invitation);
  }
}

function toPublic(invitation: {
  id: string;
  email: string;
  type: PrismaInvitationType;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}): InvitationPublic {
  return {
    id: invitation.id,
    email: invitation.email,
    type: invitation.type.toLowerCase() as InvitationType,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
  };
}

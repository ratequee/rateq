import { BadRequestException, Injectable } from '@nestjs/common';
import { EmailService } from '../auth/services/email.service';
import type { SendMarketingEmailDto } from './dto/send-marketing-email.dto';

export interface MarketingEmailSendResult {
  sent: number;
  failed: { email: string; reason: string }[];
}

@Injectable()
export class EmailMarketingService {
  constructor(private readonly emailService: EmailService) {}

  async sendCampaign(dto: SendMarketingEmailDto): Promise<MarketingEmailSendResult> {
    const hasCtaLabel = Boolean(dto.ctaLabelEn?.trim() || dto.ctaLabelAr?.trim());

    if (hasCtaLabel && !dto.ctaUrl?.trim()) {
      throw new BadRequestException('CTA URL is required when a button label is provided');
    }

    if (dto.ctaLabelEn?.trim() && !dto.ctaLabelAr?.trim()) {
      throw new BadRequestException(
        'Arabic CTA label is required when English CTA label is provided',
      );
    }

    if (dto.ctaLabelAr?.trim() && !dto.ctaLabelEn?.trim()) {
      throw new BadRequestException(
        'English CTA label is required when Arabic CTA label is provided',
      );
    }

    const recipients = [...new Set(dto.recipients.map((email) => email.trim().toLowerCase()))];
    const failed: { email: string; reason: string }[] = [];
    let sent = 0;

    for (const email of recipients) {
      try {
        await this.emailService.sendMarketingEmail({
          to: email,
          subjectEn: dto.subjectEn.trim(),
          subjectAr: dto.subjectAr.trim(),
          headingEn: dto.headingEn.trim(),
          headingAr: dto.headingAr.trim(),
          messageEn: dto.messageEn.trim(),
          messageAr: dto.messageAr.trim(),
          ctaLabelEn: dto.ctaLabelEn?.trim() || undefined,
          ctaLabelAr: dto.ctaLabelAr?.trim() || undefined,
          ctaUrl: dto.ctaUrl?.trim() || undefined,
        });
        sent += 1;
      } catch (error) {
        failed.push({
          email,
          reason: error instanceof Error ? error.message : 'Could not send email',
        });
      }
    }

    return { sent, failed };
  }
}

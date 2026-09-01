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
    if (dto.ctaLabel?.trim() && !dto.ctaUrl?.trim()) {
      throw new BadRequestException('CTA URL is required when CTA label is provided');
    }

    const recipients = [...new Set(dto.recipients.map((email) => email.trim().toLowerCase()))];
    const failed: { email: string; reason: string }[] = [];
    let sent = 0;

    for (const email of recipients) {
      try {
        await this.emailService.sendMarketingEmail({
          to: email,
          subject: dto.subject.trim(),
          heading: dto.heading.trim(),
          message: dto.message.trim(),
          ctaLabel: dto.ctaLabel?.trim() || undefined,
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

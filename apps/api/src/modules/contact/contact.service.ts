import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MessageResponse, SubmitContactInput } from '@rateq/types';
import type { AppConfig } from '../../common/config/env.validation';
import { EmailService } from '../auth/services/email.service';

const SUBJECT_LABELS: Record<SubmitContactInput['subject'], string> = {
  general: 'General inquiry',
  support: 'Customer support',
  business: 'Business listing',
  partnership: 'Partnership',
};

@Injectable()
export class ContactService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async submit(input: SubmitContactInput): Promise<MessageResponse> {
    const recipient =
      this.configService.get('CONTACT_RECIPIENT_EMAIL', { infer: true }) ?? 'rateq90@gmail.com';
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.emailService.sendContactFormEmail(
      {
        appUrl,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        subjectLabel: SUBJECT_LABELS[input.subject],
        message: input.message.trim(),
      },
      recipient,
    );

    return { message: 'Your message has been sent successfully' };
  }
}

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../common/config/env.validation';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  isConfigured(): boolean {
    const sid = this.configService.get('TWILIO_ACCOUNT_SID', { infer: true });
    const token = this.configService.get('TWILIO_AUTH_TOKEN', { infer: true });
    const from = this.configService.get('TWILIO_WHATSAPP_FROM', { infer: true });
    return Boolean(sid && token && from);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const sid = this.configService.get('TWILIO_ACCOUNT_SID', { infer: true });
    const token = this.configService.get('TWILIO_AUTH_TOKEN', { infer: true });
    const from = this.configService.get('TWILIO_WHATSAPP_FROM', { infer: true });

    const message = `Your RateQ verification code is ${code}. It expires in 15 minutes.`;

    if (!sid || !token || !from) {
      this.logger.warn(`Twilio WhatsApp not configured — OTP not sent to ${phone}`);
      this.logger.log(`WhatsApp OTP preview for ${phone}: ${code}`);
      return;
    }

    const to = this.formatWhatsAppRecipient(phone);
    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Twilio WhatsApp failed for ${phone}: ${errorText}`);

      const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
      if (nodeEnv !== 'production') {
        this.logger.warn('Twilio failed in development — OTP logged below instead of sent');
        this.logger.log(`WhatsApp OTP preview for ${phone}: ${code}`);
        return;
      }

      throw new ServiceUnavailableException(
        'Could not send WhatsApp verification code. Please try again later.',
      );
    }

    this.logger.log(`WhatsApp OTP sent to ${phone}`);
  }

  private formatWhatsAppRecipient(phone: string): string {
    const digits = phone.replace(/[^\d+]/g, '');
    if (digits.startsWith('whatsapp:')) return digits;
    if (digits.startsWith('+')) return `whatsapp:${digits}`;
    return `whatsapp:+${digits.replace(/^\+/, '')}`;
  }
}

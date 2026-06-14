import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { AppConfig } from '../../../common/config/env.validation';
import {
  buildCompanyApprovedEmailHtml,
  buildCompanyApprovedEmailText,
  buildCompanyRejectedEmailHtml,
  buildCompanyRejectedEmailText,
  buildCompanyRevisionEmailHtml,
  buildCompanyRevisionEmailText,
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
  buildVerificationEmailHtml,
  buildVerificationEmailText,
} from '../email/email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const apiKey = this.configService.get('RESEND_API_KEY', { infer: true });
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const expiresHours = this.configService.get('AUTH_VERIFICATION_EXPIRES_HOURS', { infer: true });
    const content = { appUrl, verifyUrl, expiresHours };

    await this.send({
      to: email,
      subject: 'Verify your RateQ account',
      text: buildVerificationEmailText(content),
      html: buildVerificationEmailHtml(content),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const expiresHours = this.configService.get('AUTH_PASSWORD_RESET_EXPIRES_HOURS', {
      infer: true,
    });
    const content = { appUrl, resetUrl, expiresHours };

    await this.send({
      to: email,
      subject: 'Reset your RateQ password',
      text: buildPasswordResetEmailText(content),
      html: buildPasswordResetEmailHtml(content),
    });
  }

  async sendCompanyVerificationApprovedEmail(email: string, companyName: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const dashboardUrl = `${appUrl}/dashboard/company`;
    const content = { appUrl, dashboardUrl, companyName };

    await this.send({
      to: email,
      subject: 'Your RateQ company profile has been approved',
      text: buildCompanyApprovedEmailText(content),
      html: buildCompanyApprovedEmailHtml(content),
    });
  }

  async sendCompanyVerificationRejectedEmail(email: string, companyName: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const profileUrl = `${appUrl}/complete-profile`;
    const content = { appUrl, profileUrl, companyName };

    await this.send({
      to: email,
      subject: 'Your RateQ company profile was not approved',
      text: buildCompanyRejectedEmailText(content),
      html: buildCompanyRejectedEmailHtml(content),
    });
  }

  async sendCompanyRevisionRequestedEmail(
    email: string,
    companyName: string,
    revisionNotes: string,
  ): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const profileUrl = `${appUrl}/complete-profile`;
    const content = { appUrl, profileUrl, companyName, revisionNotes };

    await this.send({
      to: email,
      subject: 'Updates required for your RateQ company profile',
      text: buildCompanyRevisionEmailText(content),
      html: buildCompanyRevisionEmailHtml(content),
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get('EMAIL_FROM', { infer: true });

    if (!this.resend) {
      this.logger.warn(
        `Resend not configured — email not sent to ${options.to}. Subject: ${options.subject}`,
      );
      this.logger.log(`Email preview:\n${options.text}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      this.logger.error(`Resend failed for ${options.to}: ${error.message}`);
      throw new Error('Could not send email');
    }

    this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
  }
}

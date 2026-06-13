import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { AppConfig } from '../../../common/config/env.validation';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.initializeTransporter();
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.send({
      to: email,
      subject: 'Verify your RateQ account',
      text: `Verify your email by visiting: ${verifyUrl}\n\nThis link expires in ${this.configService.get('AUTH_VERIFICATION_EXPIRES_HOURS', { infer: true })} hours.`,
      html: `
        <p>Welcome to RateQ.</p>
        <p><a href="${verifyUrl}">Verify your email address</a></p>
        <p>This link expires in ${this.configService.get('AUTH_VERIFICATION_EXPIRES_HOURS', { infer: true })} hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.send({
      to: email,
      subject: 'Reset your RateQ password',
      text: `Reset your password: ${resetUrl}\n\nThis link expires in ${this.configService.get('AUTH_PASSWORD_RESET_EXPIRES_HOURS', { infer: true })} hour(s).`,
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in ${this.configService.get('AUTH_PASSWORD_RESET_EXPIRES_HOURS', { infer: true })} hour(s).</p>
        <p>If you did not request this, ignore this email.</p>
      `,
    });
  }

  async sendCompanyVerificationApprovedEmail(email: string, companyName: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const dashboardUrl = `${appUrl}/dashboard/company`;

    await this.send({
      to: email,
      subject: 'Your RateQ company profile has been approved',
      text: `Good news! Your company profile for "${companyName}" has been approved.\n\nSign in to access your dashboard: ${dashboardUrl}`,
      html: `
        <p>Good news! Your company profile for <strong>${companyName}</strong> has been approved.</p>
        <p><a href="${dashboardUrl}">Go to your company dashboard</a></p>
      `,
    });
  }

  async sendCompanyVerificationRejectedEmail(email: string, companyName: string): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const profileUrl = `${appUrl}/complete-profile`;

    await this.send({
      to: email,
      subject: 'Your RateQ company profile was not approved',
      text: `Your company profile submission for "${companyName}" was not approved and has been removed.\n\nYou may register a new company profile after signing in: ${profileUrl}`,
      html: `
        <p>Your company profile submission for <strong>${companyName}</strong> was not approved and has been removed.</p>
        <p>You may register a new company profile after signing in.</p>
        <p><a href="${profileUrl}">Complete profile</a></p>
      `,
    });
  }

  async sendCompanyRevisionRequestedEmail(
    email: string,
    companyName: string,
    revisionNotes: string,
  ): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const profileUrl = `${appUrl}/complete-profile`;
    const escapedNotes = revisionNotes.replace(/\n/g, '<br/>');

    await this.send({
      to: email,
      subject: 'Updates required for your RateQ company profile',
      text: `Your company profile for "${companyName}" requires updates before it can be approved.\n\nRequested changes:\n${revisionNotes}\n\nUpdate your profile: ${profileUrl}`,
      html: `
        <p>Your company profile for <strong>${companyName}</strong> requires updates before it can be approved.</p>
        <p><strong>Requested changes:</strong></p>
        <p>${escapedNotes}</p>
        <p><a href="${profileUrl}">Update your profile</a></p>
      `,
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get('EMAIL_FROM', { infer: true });

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — email not sent to ${options.to}. Subject: ${options.subject}`,
      );
      this.logger.log(`Email preview:\n${options.text}`);
      return;
    }

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
  }

  private initializeTransporter(): void {
    const host = this.configService.get('SMTP_HOST', { infer: true });

    if (!host) {
      return;
    }

    const port = this.configService.get('SMTP_PORT', { infer: true }) ?? 587;
    const user = this.configService.get('SMTP_USER', { infer: true });
    const pass = this.configService.get('SMTP_PASSWORD', { infer: true });

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }
}

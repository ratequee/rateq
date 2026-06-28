import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { AppConfig } from '../../../common/config/env.validation';
import { bilingualSubject } from '../email/email-bilingual.util';
import {
  buildCompanyApprovedEmailHtml,
  buildCompanyApprovedEmailText,
  buildCompanyRejectedEmailHtml,
  buildCompanyRejectedEmailText,
  buildCompanyRevisionEmailHtml,
  buildCompanyRevisionEmailText,
  buildUserInvitationEmailHtml,
  buildUserInvitationEmailText,
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
  buildVerificationEmailHtml,
  buildVerificationEmailText,
  type UserInvitationEmailContent,
} from '../email/email-templates';
import {
  buildContactFormEmailHtml,
  buildContactFormEmailText,
  type ContactFormEmailContent,
} from '../../contact/email/contact-email-templates';
import {
  buildAccountDeactivatedEmailHtml,
  buildAccountDeactivatedEmailText,
  buildAccountDeletedEmailHtml,
  buildAccountDeletedEmailText,
  buildAccountReactivatedEmailHtml,
  buildAccountReactivatedEmailText,
  buildReviewDeletedEmailHtml,
  buildReviewDeletedEmailText,
  type AccountStatusEmailContent,
  type ReviewDeletedEmailContent,
} from '../email/email-account-templates';
import {
  buildReviewApprovedEmailHtml,
  buildReviewApprovedEmailText,
  buildReviewPublishedEmailHtml,
  buildReviewPublishedEmailText,
  buildReviewRejectedEmailHtml,
  buildReviewRejectedEmailText,
  buildReviewResolutionCompanyEmailHtml,
  buildReviewResolutionCompanyEmailText,
  buildReviewResolutionReviewerEmailHtml,
  buildReviewResolutionReviewerEmailText,
  buildReviewWithdrawnEmailHtml,
  buildReviewWithdrawnEmailText,
  buildReviewReplyApprovedEmailHtml,
  buildReviewReplyApprovedEmailText,
  buildReviewReplyRejectedEmailHtml,
  buildReviewReplyRejectedEmailText,
  type ReviewDecisionEmailContent,
  type ReviewOutcomeEmailContent,
  type ReviewReplyDecisionEmailContent,
  type ReviewResolutionCompanyEmailContent,
  type ReviewResolutionReviewerEmailContent,
} from '../email/email-review-templates';

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
      subject: bilingualSubject('Verify your RateQ account', 'تأكيد حسابك في RateQ'),
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
      subject: bilingualSubject('Reset your RateQ password', 'إعادة تعيين كلمة مرور RateQ'),
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
      subject: bilingualSubject(
        'Your RateQ company profile has been approved',
        'تمت الموافقة على ملف شركتكم في RateQ',
      ),
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
      subject: bilingualSubject(
        'Your RateQ company profile was not approved',
        'لم تتم الموافقة على ملف شركتكم في RateQ',
      ),
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
      subject: bilingualSubject(
        'Updates required for your RateQ company profile',
        'مطلوب تحديثات على ملف شركتكم في RateQ',
      ),
      text: buildCompanyRevisionEmailText(content),
      html: buildCompanyRevisionEmailHtml(content),
    });
  }

  async sendUserInvitationEmail(
    content: UserInvitationEmailContent & { email: string },
  ): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const isCompany = content.invitationType === 'company';

    await this.send({
      to: content.email,
      subject: bilingualSubject(
        isCompany ? 'You are invited to register on RateQ' : 'You are invited to review on RateQ',
        isCompany ? 'دعوة لتسجيل شركتكم على RateQ' : 'دعوة للمراجعة على RateQ',
      ),
      text: buildUserInvitationEmailText(content),
      html: buildUserInvitationEmailHtml({ ...content, appUrl }),
    });
  }

  async sendReviewApprovedEmail(content: ReviewDecisionEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.reviewerEmail,
      subject: bilingualSubject(
        'Your RateQ review has been approved',
        'تمت الموافقة على تقييمكم في RateQ',
      ),
      text: buildReviewApprovedEmailText(content),
      html: buildReviewApprovedEmailHtml({ ...content, appUrl }),
    });
  }

  async sendReviewRejectedEmail(content: ReviewDecisionEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.reviewerEmail,
      subject: bilingualSubject(
        'Your RateQ review was not approved',
        'لم تتم الموافقة على تقييمكم في RateQ',
      ),
      text: buildReviewRejectedEmailText(content),
      html: buildReviewRejectedEmailHtml({ ...content, appUrl }),
    });
  }

  async sendReviewReplyApprovedEmail(content: ReviewReplyDecisionEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const reviewsUrl = `${appUrl}/dashboard/company/reviews`;
    const { companyEmail, ...rest } = content;

    await this.send({
      to: companyEmail,
      subject: bilingualSubject(
        `Your reply for ${content.companyName} has been approved`,
        `تمت الموافقة على ردكم لـ ${content.companyName}`,
      ),
      text: buildReviewReplyApprovedEmailText(content),
      html: buildReviewReplyApprovedEmailHtml({ ...rest, appUrl, reviewsUrl }),
    });
  }

  async sendReviewReplyRejectedEmail(content: ReviewReplyDecisionEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const reviewsUrl = `${appUrl}/dashboard/company/reviews`;
    const { companyEmail, ...rest } = content;

    await this.send({
      to: companyEmail,
      subject: bilingualSubject(
        `Your reply for ${content.companyName} was not approved`,
        `لم تتم الموافقة على ردكم لـ ${content.companyName}`,
      ),
      text: buildReviewReplyRejectedEmailText(content),
      html: buildReviewReplyRejectedEmailHtml({ ...rest, appUrl, reviewsUrl }),
    });
  }

  async sendReviewResolutionToCompanyEmail(
    content: ReviewResolutionCompanyEmailContent,
  ): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const { companyEmail, ...rest } = content;

    await this.send({
      to: companyEmail,
      subject: bilingualSubject(
        `Negative review awaiting resolution — ${content.companyName}`,
        `تقييم سلبي بانتظار الحل — ${content.companyName}`,
      ),
      text: buildReviewResolutionCompanyEmailText(content),
      html: buildReviewResolutionCompanyEmailHtml({ ...rest, appUrl }),
    });
  }

  async sendReviewResolutionToReviewerEmail(
    content: Omit<ReviewResolutionReviewerEmailContent, 'reviewsUrl'>,
  ): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });
    const reviewsUrl = `${appUrl}/dashboard/reviewer/reviews`;
    const payload: ReviewResolutionReviewerEmailContent = { ...content, reviewsUrl };

    await this.send({
      to: content.reviewerEmail,
      subject: bilingualSubject(
        `Choose whether to publish your review for ${content.companyName}`,
        `اختاروا نشر أو سحب تقييمكم لـ ${content.companyName}`,
      ),
      text: buildReviewResolutionReviewerEmailText(payload),
      html: buildReviewResolutionReviewerEmailHtml({ ...payload, appUrl }),
    });
  }

  async sendReviewPublishedEmails(content: ReviewOutcomeEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.reviewerEmail,
      subject: bilingualSubject(
        `Your review for ${content.companyName} is now published`,
        `تقييمكم لـ ${content.companyName} منشور الآن`,
      ),
      text: buildReviewPublishedEmailText(content),
      html: buildReviewPublishedEmailHtml({
        appUrl,
        companyName: content.companyName,
        reviewTitle: content.reviewTitle,
        isCompany: false,
      }),
    });

    if (content.companyEmail) {
      await this.send({
        to: content.companyEmail,
        subject: bilingualSubject(
          `A review for ${content.companyName} has been published`,
          `تم نشر تقييم لـ ${content.companyName}`,
        ),
        text: buildReviewPublishedEmailText(content),
        html: buildReviewPublishedEmailHtml({
          appUrl,
          companyName: content.companyName,
          reviewTitle: content.reviewTitle,
          isCompany: true,
        }),
      });
    }
  }

  async sendReviewWithdrawnEmails(content: ReviewOutcomeEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.reviewerEmail,
      subject: bilingualSubject(
        `Your review for ${content.companyName} was withdrawn`,
        `تم سحب تقييمكم لـ ${content.companyName}`,
      ),
      text: buildReviewWithdrawnEmailText(content),
      html: buildReviewWithdrawnEmailHtml({
        appUrl,
        companyName: content.companyName,
        reviewTitle: content.reviewTitle,
        isCompany: false,
      }),
    });

    if (content.companyEmail) {
      await this.send({
        to: content.companyEmail,
        subject: bilingualSubject(
          `A review for ${content.companyName} was withdrawn`,
          `تم سحب تقييم لـ ${content.companyName}`,
        ),
        text: buildReviewWithdrawnEmailText(content),
        html: buildReviewWithdrawnEmailHtml({
          appUrl,
          companyName: content.companyName,
          reviewTitle: content.reviewTitle,
          isCompany: true,
        }),
      });
    }
  }

  async sendAccountDeactivatedEmail(content: AccountStatusEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.email,
      subject: bilingualSubject(
        'Your RateQ account has been deactivated',
        'تم إلغاء تفعيل حسابكم في RateQ',
      ),
      text: buildAccountDeactivatedEmailText(content),
      html: buildAccountDeactivatedEmailHtml({ ...content, appUrl }),
    });
  }

  async sendAccountReactivatedEmail(content: AccountStatusEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.email,
      subject: bilingualSubject(
        'Your RateQ account has been reactivated',
        'تمت إعادة تفعيل حسابكم في RateQ',
      ),
      text: buildAccountReactivatedEmailText(content),
      html: buildAccountReactivatedEmailHtml({ ...content, appUrl }),
    });
  }

  async sendAccountDeletedEmail(content: AccountStatusEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.email,
      subject: bilingualSubject('Your RateQ account has been deleted', 'تم حذف حسابكم في RateQ'),
      text: buildAccountDeletedEmailText(content),
      html: buildAccountDeletedEmailHtml({ ...content, appUrl }),
    });
  }

  async sendReviewDeletedEmail(content: ReviewDeletedEmailContent): Promise<void> {
    const appUrl = this.configService.get('APP_URL', { infer: true });

    await this.send({
      to: content.reviewerEmail,
      subject: bilingualSubject(
        `Your review for ${content.companyName} was removed`,
        `تمت إزالة تقييمكم لـ ${content.companyName}`,
      ),
      text: buildReviewDeletedEmailText(content),
      html: buildReviewDeletedEmailHtml({ ...content, appUrl }),
    });
  }

  async sendContactFormEmail(content: ContactFormEmailContent, recipient: string): Promise<void> {
    await this.send({
      to: recipient,
      replyTo: content.email,
      subject: bilingualSubject(
        `RateQ contact form — ${content.subjectLabel}`,
        `نموذج التواصل في RateQ — ${content.subjectLabel}`,
      ),
      text: buildContactFormEmailText(content),
      html: buildContactFormEmailHtml(content),
    });
  }

  private async send(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
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
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
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

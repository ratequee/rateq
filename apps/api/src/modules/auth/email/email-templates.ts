import {
  emailButton,
  emailCallout,
  emailFallbackLink,
  emailParagraph,
  emailSecondaryLink,
  escapeHtml,
  renderEmailLayout,
} from './email-html.util';

export interface VerificationEmailContent {
  appUrl: string;
  verifyUrl: string;
  expiresHours: number;
}

export interface PasswordResetEmailContent {
  appUrl: string;
  resetUrl: string;
  expiresHours: number;
}

export interface CompanyApprovedEmailContent {
  appUrl: string;
  dashboardUrl: string;
  companyName: string;
}

export interface CompanyRejectedEmailContent {
  appUrl: string;
  profileUrl: string;
  companyName: string;
}

export interface CompanyRevisionEmailContent {
  appUrl: string;
  profileUrl: string;
  companyName: string;
  revisionNotes: string;
}

export function buildVerificationEmailHtml(content: VerificationEmailContent): string {
  const bodyHtml = `
    ${emailParagraph("Welcome to RateQ — Qatar's trusted review platform. Confirm your email to activate your account and start exploring verified businesses and reviews.")}
    ${emailButton(content.verifyUrl, 'Verify email address')}
    ${emailSecondaryLink(content.verifyUrl, 'Open verification link')}
    ${emailFallbackLink(content.verifyUrl)}
    ${emailCallout(
      'Link expires soon',
      `<p style="margin:0;">This verification link expires in <strong>${content.expiresHours} hour${content.expiresHours === 1 ? '' : 's'}</strong>. If you did not create a RateQ account, you can safely ignore this email.</p>`,
      'info',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Confirm your email to activate your RateQ account.',
    eyebrow: 'Account verification',
    title: 'Verify your email address',
    bodyHtml,
    footerNote: 'You received this email because a RateQ account was created with this address.',
  });
}

export function buildVerificationEmailText(content: VerificationEmailContent): string {
  return [
    'Welcome to RateQ',
    '',
    'Verify your email address to activate your account:',
    content.verifyUrl,
    '',
    `This link expires in ${content.expiresHours} hour(s).`,
    '',
    'If you did not create a RateQ account, you can ignore this email.',
  ].join('\n');
}

export function buildPasswordResetEmailHtml(content: PasswordResetEmailContent): string {
  const bodyHtml = `
    ${emailParagraph('We received a request to reset the password for your RateQ account. Use the button below to choose a new password.')}
    ${emailButton(content.resetUrl, 'Reset password')}
    ${emailSecondaryLink(content.resetUrl, 'Open password reset link')}
    ${emailFallbackLink(content.resetUrl)}
    ${emailCallout(
      'Did not request this?',
      `<p style="margin:0;">If you did not ask to reset your password, no action is needed — your account remains secure. This link expires in <strong>${content.expiresHours} hour${content.expiresHours === 1 ? '' : 's'}</strong>.</p>`,
      'warning',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Reset your RateQ password securely.',
    eyebrow: 'Security',
    title: 'Reset your password',
    bodyHtml,
    footerNote: 'You received this email because a password reset was requested for your account.',
  });
}

export function buildPasswordResetEmailText(content: PasswordResetEmailContent): string {
  return [
    'Reset your RateQ password',
    '',
    'Use this link to choose a new password:',
    content.resetUrl,
    '',
    `This link expires in ${content.expiresHours} hour(s).`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');
}

export function buildCompanyApprovedEmailHtml(content: CompanyApprovedEmailContent): string {
  const safeCompany = escapeHtml(content.companyName);

  const bodyHtml = `
    ${emailParagraph(`Great news — your company profile for ${content.companyName} has been reviewed and approved.`)} 
    ${emailCallout(
      "You're live on RateQ",
      `<p style="margin:0;">Customers can now discover <strong>${safeCompany}</strong>, read your profile, and leave verified reviews. Head to your dashboard to manage your presence.</p>`,
      'success',
    )}
    ${emailButton(content.dashboardUrl, 'Open company dashboard')}
    ${emailSecondaryLink(content.dashboardUrl, 'Go to dashboard')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your company profile for ${content.companyName} has been approved.`,
    eyebrow: 'Company verification',
    title: 'Profile approved',
    bodyHtml,
  });
}

export function buildCompanyApprovedEmailText(content: CompanyApprovedEmailContent): string {
  return [
    'Your RateQ company profile has been approved',
    '',
    `Company: ${content.companyName}`,
    '',
    `Open your dashboard: ${content.dashboardUrl}`,
  ].join('\n');
}

export function buildCompanyRejectedEmailHtml(content: CompanyRejectedEmailContent): string {
  const safeCompany = escapeHtml(content.companyName);

  const bodyHtml = `
    ${emailParagraph(`After review, your company profile submission for ${content.companyName} was not approved and has been removed from RateQ.`)}
    ${emailCallout(
      'What happens next',
      `<p style="margin:0;">You may sign in and submit a new company profile with updated information. Make sure your documents are clear, valid, and match your commercial registration details for <strong>${safeCompany}</strong>.</p>`,
      'danger',
    )}
    ${emailButton(content.profileUrl, 'Register company profile')}
    ${emailSecondaryLink(content.profileUrl, 'Complete profile')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your company profile for ${content.companyName} was not approved.`,
    eyebrow: 'Company verification',
    title: 'Profile not approved',
    bodyHtml,
  });
}

export function buildCompanyRejectedEmailText(content: CompanyRejectedEmailContent): string {
  return [
    'Your RateQ company profile was not approved',
    '',
    `Company: ${content.companyName}`,
    '',
    'Your submission has been removed. You may register a new company profile after signing in:',
    content.profileUrl,
  ].join('\n');
}

export function buildCompanyRevisionEmailHtml(content: CompanyRevisionEmailContent): string {
  const safeCompany = escapeHtml(content.companyName);
  const notesHtml = escapeHtml(content.revisionNotes).replace(/\n/g, '<br/>');

  const bodyHtml = `
    ${emailParagraph(`Your company profile for ${content.companyName} is almost ready — our team needs a few updates before we can approve it.`)}
    ${emailCallout('Requested changes', `<p style="margin:0;">${notesHtml}</p>`, 'warning')}
    ${emailParagraph('Update your documents and details, then resubmit your profile for review.')}
    ${emailButton(content.profileUrl, 'Update company profile')}
    ${emailSecondaryLink(content.profileUrl, 'Open complete profile')}
    ${emailCallout(
      'Company profile',
      `<p style="margin:0;"><strong>${safeCompany}</strong></p>`,
      'info',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Updates required for ${content.companyName} before approval.`,
    eyebrow: 'Action required',
    title: 'Updates required on your profile',
    bodyHtml,
  });
}

export function buildCompanyRevisionEmailText(content: CompanyRevisionEmailContent): string {
  return [
    'Updates required for your RateQ company profile',
    '',
    `Company: ${content.companyName}`,
    '',
    'Requested changes:',
    content.revisionNotes,
    '',
    `Update your profile: ${content.profileUrl}`,
  ].join('\n');
}

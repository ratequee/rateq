import { emailCallout, emailParagraph, escapeHtml, renderEmailLayout } from './email-html.util';

export interface AccountStatusEmailContent {
  email: string;
  displayName?: string | null;
  companyName?: string | null;
}

export interface ReviewDeletedEmailContent {
  reviewerEmail: string;
  reviewTitle: string;
  companyName: string;
}

export function buildAccountDeactivatedEmailHtml(
  content: AccountStatusEmailContent & { appUrl: string },
): string {
  const name = content.displayName?.trim() || 'there';
  const companyNote = content.companyName
    ? `<p style="margin:0;">Your company profile <strong>${escapeHtml(content.companyName)}</strong> is no longer visible on RateQ while your account is inactive.</p>`
    : '<p style="margin:0;">You will not be able to sign in, submit reviews, or use dashboard features until your account is reactivated.</p>';

  const bodyHtml = `
    ${emailParagraph(`Hi ${escapeHtml(name)},`)}
    ${emailParagraph('Your RateQ account has been deactivated by an administrator.')}
    ${emailCallout('What this means', companyNote, 'warning')}
    ${emailParagraph('If you believe this was a mistake, please contact RateQ support.')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Your RateQ account has been deactivated.',
    eyebrow: 'Account status',
    title: 'Account deactivated',
    bodyHtml,
  });
}

export function buildAccountDeactivatedEmailText(content: AccountStatusEmailContent): string {
  const lines = [
    'Your RateQ account has been deactivated.',
    '',
    'You cannot sign in or use RateQ features until your account is reactivated.',
  ];
  if (content.companyName) {
    lines.push('', `Company profile hidden: ${content.companyName}`);
  }
  lines.push('', 'Contact support if you believe this was a mistake.');
  return lines.join('\n');
}

export function buildAccountReactivatedEmailHtml(
  content: AccountStatusEmailContent & { appUrl: string },
): string {
  const name = content.displayName?.trim() || 'there';

  const bodyHtml = `
    ${emailParagraph(`Hi ${escapeHtml(name)},`)}
    ${emailParagraph('Good news — your RateQ account has been reactivated. You can sign in and use the platform again.')}
    ${emailCallout(
      'Welcome back',
      '<p style="margin:0;">Sign in to your dashboard to continue using RateQ.</p>',
      'success',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Your RateQ account is active again.',
    eyebrow: 'Account status',
    title: 'Account reactivated',
    bodyHtml,
  });
}

export function buildAccountReactivatedEmailText(content: AccountStatusEmailContent): string {
  const name = content.displayName?.trim() || 'there';
  return [
    `Hi ${name},`,
    '',
    'Your RateQ account has been reactivated. You can sign in and use the platform again.',
  ].join('\n');
}

export function buildAccountDeletedEmailHtml(
  content: AccountStatusEmailContent & { appUrl: string },
): string {
  const name = content.displayName?.trim() || 'there';

  const bodyHtml = `
    ${emailParagraph(`Hi ${escapeHtml(name)},`)}
    ${emailParagraph('Your RateQ account and associated profile data have been permanently deleted by an administrator.')}
    ${emailCallout(
      'Account removed',
      '<p style="margin:0;">This action cannot be undone. If you wish to use RateQ again, you will need to create a new account.</p>',
      'warning',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Your RateQ account has been deleted.',
    eyebrow: 'Account status',
    title: 'Account deleted',
    bodyHtml,
  });
}

export function buildAccountDeletedEmailText(content: AccountStatusEmailContent): string {
  const name = content.displayName?.trim() || 'there';
  return [
    `Hi ${name},`,
    '',
    'Your RateQ account and associated profile data have been permanently deleted.',
    'If you wish to use RateQ again, you will need to create a new account.',
  ].join('\n');
}

export function buildReviewDeletedEmailHtml(
  content: Omit<ReviewDeletedEmailContent, 'reviewerEmail'> & { appUrl: string },
): string {
  const bodyHtml = `
    ${emailParagraph(`Your review "${escapeHtml(content.reviewTitle)}" for ${escapeHtml(content.companyName)} has been removed from RateQ by an administrator.`)}
    ${emailCallout(
      'Review removed',
      '<p style="margin:0;">You may submit a new review for this company if you still have feedback to share.</p>',
      'warning',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your review for ${content.companyName} was removed.`,
    eyebrow: 'Review update',
    title: 'Your review was removed',
    bodyHtml,
  });
}

export function buildReviewDeletedEmailText(content: ReviewDeletedEmailContent): string {
  return [
    'Your review was removed',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
    '',
    'You may submit a new review for this company if you still have feedback to share.',
  ].join('\n');
}

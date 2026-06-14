import {
  emailButton,
  emailCallout,
  emailParagraph,
  emailSecondaryLink,
  escapeHtml,
  renderEmailLayout,
} from './email-html.util';

function reviewStars(rating: number): string {
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`;
}

export interface ReviewDecisionEmailContent {
  reviewerEmail: string;
  reviewTitle: string;
  companyName: string;
}

export interface ReviewResolutionCompanyEmailContent {
  companyEmail: string;
  companyName: string;
  reviewTitle: string;
  reviewContent: string;
  reviewRating: number;
  reviewerName: string;
  reviewerEmail: string;
  reviewerPhone: string | null;
}

export interface ReviewResolutionReviewerEmailContent {
  reviewerEmail: string;
  companyName: string;
  reviewTitle: string;
  reviewsUrl: string;
}

export interface ReviewOutcomeEmailContent {
  reviewerEmail: string;
  companyEmail: string | null;
  companyName: string;
  reviewTitle: string;
}

export function buildReviewApprovedEmailHtml(
  content: Omit<ReviewDecisionEmailContent, 'reviewerEmail'> & { appUrl: string },
): string {
  const bodyHtml = `
    ${emailParagraph(`Your review "${content.reviewTitle}" for ${content.companyName} has been approved and is now published on RateQ.`)}
    ${emailCallout(
      'Thank you for sharing',
      '<p style="margin:0;">Your feedback helps other customers make informed decisions and helps businesses improve.</p>',
      'success',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your review for ${content.companyName} is now live.`,
    eyebrow: 'Review approved',
    title: 'Your review has been published',
    bodyHtml,
  });
}

export function buildReviewApprovedEmailText(content: ReviewDecisionEmailContent): string {
  return [
    'Your review has been approved',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');
}

export function buildReviewRejectedEmailHtml(
  content: Omit<ReviewDecisionEmailContent, 'reviewerEmail'> & { appUrl: string },
): string {
  const bodyHtml = `
    ${emailParagraph(`Your review "${content.reviewTitle}" for ${content.companyName} was not approved and will not be published on RateQ.`)}
    ${emailCallout(
      'Need help?',
      '<p style="margin:0;">If you believe this decision was made in error, contact RateQ support with your review details.</p>',
      'danger',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your review for ${content.companyName} was not approved.`,
    eyebrow: 'Review update',
    title: 'Your review was not approved',
    bodyHtml,
  });
}

export function buildReviewRejectedEmailText(content: ReviewDecisionEmailContent): string {
  return [
    'Your review was not approved',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');
}

export function buildReviewResolutionCompanyEmailHtml(
  content: Omit<ReviewResolutionCompanyEmailContent, 'companyEmail'> & { appUrl: string },
): string {
  const safeTitle = escapeHtml(content.reviewTitle);
  const safeContent = escapeHtml(content.reviewContent);
  const contactLines = [
    `<strong>${escapeHtml(content.reviewerName)}</strong>`,
    `<a href="mailto:${escapeHtml(content.reviewerEmail)}" style="color:#8E2157;text-decoration:none;">${escapeHtml(content.reviewerEmail)}</a>`,
    content.reviewerPhone
      ? `<a href="tel:${escapeHtml(content.reviewerPhone)}" style="color:#8E2157;text-decoration:none;">${escapeHtml(content.reviewerPhone)}</a>`
      : 'Phone not provided',
  ].join('<br/>');

  const bodyHtml = `
    ${emailParagraph(`A reviewer has submitted negative feedback about ${content.companyName}. RateQ has opened a resolution window so you can contact the reviewer directly and resolve the matter.`)}
    ${emailCallout(
      safeTitle,
      `<p style="margin:0 0 10px;">${reviewStars(content.reviewRating)}</p><p style="margin:0;">${safeContent}</p>`,
      'warning',
    )}
    ${emailCallout('Reviewer contact', `<p style="margin:0;">${contactLines}</p>`, 'info')}
    ${emailParagraph('Please reach out to the reviewer promptly and professionally. The reviewer will decide whether to publish or withdraw the review.')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Negative review awaiting resolution for ${content.companyName}.`,
    eyebrow: 'Resolution requested',
    title: 'Contact the reviewer to resolve this review',
    bodyHtml,
  });
}

export function buildReviewResolutionCompanyEmailText(
  content: ReviewResolutionCompanyEmailContent,
): string {
  return [
    'A negative review requires resolution',
    '',
    `Company: ${content.companyName}`,
    `Review: ${content.reviewTitle}`,
    `Rating: ${content.reviewRating}/5`,
    '',
    content.reviewContent,
    '',
    'Reviewer contact:',
    content.reviewerName,
    content.reviewerEmail,
    content.reviewerPhone ?? 'Phone not provided',
  ].join('\n');
}

export function buildReviewResolutionReviewerEmailHtml(
  content: Omit<ReviewResolutionReviewerEmailContent, 'reviewerEmail'> & { appUrl: string },
): string {
  const bodyHtml = `
    ${emailParagraph(`Your review "${content.reviewTitle}" for ${content.companyName} has been sent to the company for resolution. They may contact you using the details on your RateQ profile.`)}
    ${emailParagraph('Once you have had a chance to discuss the issue, choose whether to publish the review or withdraw it.')}
    ${emailButton(content.reviewsUrl, 'Proceed or withdraw review')}
    ${emailSecondaryLink(content.reviewsUrl, 'Open my reviews')}
    ${emailCallout(
      'Your options',
      '<p style="margin:0;"><strong>Proceed</strong> publishes the review on RateQ.<br/><strong>Withdraw</strong> removes the review permanently.</p>',
      'info',
    )}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Choose whether to publish or withdraw your review for ${content.companyName}.`,
    eyebrow: 'Action required',
    title: 'Decide whether to publish your review',
    bodyHtml,
  });
}

export function buildReviewResolutionReviewerEmailText(
  content: ReviewResolutionReviewerEmailContent,
): string {
  return [
    'Your review is awaiting your decision',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
    '',
    `Proceed or withdraw: ${content.reviewsUrl}`,
  ].join('\n');
}

export function buildReviewPublishedEmailHtml(content: {
  appUrl: string;
  companyName: string;
  reviewTitle: string;
  isCompany: boolean;
}): string {
  const bodyHtml = content.isCompany
    ? `${emailParagraph(`The reviewer chose to publish their review "${content.reviewTitle}" for ${content.companyName}. It is now visible on your RateQ profile.`)}`
    : `${emailParagraph(`Your review "${content.reviewTitle}" for ${content.companyName} is now published on RateQ.`)}`;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Review published for ${content.companyName}.`,
    eyebrow: 'Review published',
    title: 'Review is now live',
    bodyHtml,
  });
}

export function buildReviewPublishedEmailText(content: ReviewOutcomeEmailContent): string {
  return [
    'Review published',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');
}

export function buildReviewWithdrawnEmailHtml(content: {
  appUrl: string;
  companyName: string;
  reviewTitle: string;
  isCompany: boolean;
}): string {
  const bodyHtml = content.isCompany
    ? `${emailParagraph(`The reviewer withdrew their review "${content.reviewTitle}" for ${content.companyName}. It will not be published on RateQ.`)}`
    : `${emailParagraph(`You withdrew your review "${content.reviewTitle}" for ${content.companyName}. It will not be published on RateQ.`)}`;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Review withdrawn for ${content.companyName}.`,
    eyebrow: 'Review withdrawn',
    title: 'Review will not be published',
    bodyHtml,
  });
}

export function buildReviewWithdrawnEmailText(content: ReviewOutcomeEmailContent): string {
  return [
    'Review withdrawn',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');
}

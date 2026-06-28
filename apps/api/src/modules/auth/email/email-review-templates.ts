import { emailParagraphRtl } from './email-bilingual.util';
import {
  appendBilingualText,
  emailButton,
  emailCallout,
  emailParagraph,
  emailSecondaryLink,
  escapeHtml,
  renderBilingualEmailLayout,
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

export interface ReviewReplyDecisionEmailContent {
  companyEmail: string;
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`تمت الموافقة على تقييمكم "${content.reviewTitle}" لـ ${content.companyName} ونُشر الآن على RateQ.`)}
    ${emailCallout(
      'شكرًا لمشاركتكم',
      '<p dir="rtl" style="margin:0;text-align:right;">ملاحظاتكم تساعد العملاء الآخرين على اتخاذ قرارات مدروسة وتساعد الشركات على التحسّن.</p>',
      'success',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your review for ${content.companyName} is now live. | تقييمكم لـ ${content.companyName} متاح الآن.`,
    eyebrow: 'Review approved | تمت الموافقة على التقييم',
    title: 'Your review has been published',
    titleAr: 'تم نشر تقييمكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewApprovedEmailText(content: ReviewDecisionEmailContent): string {
  const english = [
    'Your review has been approved',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');

  const arabic = [
    'تمت الموافقة على تقييمكم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`لم تتم الموافقة على تقييمكم "${content.reviewTitle}" لـ ${content.companyName} ولن يُنشر على RateQ.`)}
    ${emailCallout(
      'هل تحتاجون مساعدة؟',
      '<p dir="rtl" style="margin:0;text-align:right;">إذا كنتم تعتقدون أن هذا القرار خاطئ، تواصلوا مع دعم RateQ مع تفاصيل تقييمكم.</p>',
      'danger',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your review for ${content.companyName} was not approved. | لم تتم الموافقة على تقييمكم لـ ${content.companyName}.`,
    eyebrow: 'Review update | تحديث التقييم',
    title: 'Your review was not approved',
    titleAr: 'لم تتم الموافقة على تقييمكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewRejectedEmailText(content: ReviewDecisionEmailContent): string {
  const english = [
    'Your review was not approved',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');

  const arabic = [
    'لم تتم الموافقة على تقييمكم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const contactLinesAr = [
    `<strong>${escapeHtml(content.reviewerName)}</strong>`,
    `<a href="mailto:${escapeHtml(content.reviewerEmail)}" style="color:#8E2157;text-decoration:none;">${escapeHtml(content.reviewerEmail)}</a>`,
    content.reviewerPhone
      ? `<a href="tel:${escapeHtml(content.reviewerPhone)}" style="color:#8E2157;text-decoration:none;">${escapeHtml(content.reviewerPhone)}</a>`
      : 'لم يُقدَّم رقم هاتف',
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`قدّم أحد المقيّمين ملاحظات سلبية عن ${content.companyName}. فتح RateQ نافذة حل لتمكينكم من التواصل مباشرة مع المقيّم وحل المسألة.`)}
    ${emailCallout(
      safeTitle,
      `<p dir="rtl" style="margin:0 0 10px;text-align:right;">${reviewStars(content.reviewRating)}</p><p dir="rtl" style="margin:0;text-align:right;">${safeContent}</p>`,
      'warning',
    )}
    ${emailCallout('بيانات المقيّم', `<p dir="rtl" style="margin:0;text-align:right;">${contactLinesAr}</p>`, 'info')}
    ${emailParagraphRtl('يُرجى التواصل مع المقيّم بسرعة وباحترافية. سيقرّر المقيّم ما إذا كان سينشر التقييم أو يسحبه.')}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Negative review awaiting resolution for ${content.companyName}. | تقييم سلبي بانتظار الحل لـ ${content.companyName}.`,
    eyebrow: 'Resolution requested | طُلب حل المسألة',
    title: 'Contact the reviewer to resolve this review',
    titleAr: 'تواصلوا مع المقيّم لحل هذا التقييم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewResolutionCompanyEmailText(
  content: ReviewResolutionCompanyEmailContent,
): string {
  const english = [
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

  const arabic = [
    'تقييم سلبي يتطلب حلًا',
    '',
    `الشركة: ${content.companyName}`,
    `التقييم: ${content.reviewTitle}`,
    `التصنيف: ${content.reviewRating}/5`,
    '',
    content.reviewContent,
    '',
    'بيانات المقيّم:',
    content.reviewerName,
    content.reviewerEmail,
    content.reviewerPhone ?? 'لم يُقدَّم رقم هاتف',
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`أُرسل تقييمكم "${content.reviewTitle}" لـ ${content.companyName} إلى الشركة لحل المسألة. قد يتواصلون معكم باستخدام بياناتكم في ملف RateQ.`)}
    ${emailParagraphRtl('بعد مناقشة المسألة، اختاروا ما إذا كنتم ستنشرون التقييم أو تسحبونه.')}
    ${emailButton(content.reviewsUrl, 'المتابعة أو سحب التقييم')}
    ${emailSecondaryLink(content.reviewsUrl, 'فتح تقييماتي')}
    ${emailCallout(
      'خياراتكم',
      '<p dir="rtl" style="margin:0;text-align:right;"><strong>المتابعة</strong> تنشر التقييم على RateQ.<br/><strong>السحب</strong> يزيل التقييم نهائيًا.</p>',
      'info',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Choose whether to publish or withdraw your review for ${content.companyName}. | اختاروا نشر أو سحب تقييمكم لـ ${content.companyName}.`,
    eyebrow: 'Action required | إجراء مطلوب',
    title: 'Decide whether to publish your review',
    titleAr: 'قرّروا ما إذا كنتم ستنشرون تقييمكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewResolutionReviewerEmailText(
  content: ReviewResolutionReviewerEmailContent,
): string {
  const english = [
    'Your review is awaiting your decision',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
    '',
    `Proceed or withdraw: ${content.reviewsUrl}`,
  ].join('\n');

  const arabic = [
    'تقييمكم بانتظار قراركم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
    '',
    `المتابعة أو السحب: ${content.reviewsUrl}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = content.isCompany
    ? `${emailParagraphRtl(`اختار المقيّم نشر تقييمه "${content.reviewTitle}" لـ ${content.companyName}. أصبح مرئيًا الآن على ملفكم في RateQ.`)}`
    : `${emailParagraphRtl(`تقييمكم "${content.reviewTitle}" لـ ${content.companyName} منشور الآن على RateQ.`)}`;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Review published for ${content.companyName}. | تم نشر التقييم لـ ${content.companyName}.`,
    eyebrow: 'Review published | تم نشر التقييم',
    title: 'Review is now live',
    titleAr: 'التقييم متاح الآن',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewPublishedEmailText(content: ReviewOutcomeEmailContent): string {
  const english = [
    'Review published',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');

  const arabic = [
    'تم نشر التقييم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = content.isCompany
    ? `${emailParagraphRtl(`سحب المقيّم تقييمه "${content.reviewTitle}" لـ ${content.companyName}. لن يُنشر على RateQ.`)}`
    : `${emailParagraphRtl(`سحبتم تقييمكم "${content.reviewTitle}" لـ ${content.companyName}. لن يُنشر على RateQ.`)}`;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Review withdrawn for ${content.companyName}. | تم سحب التقييم لـ ${content.companyName}.`,
    eyebrow: 'Review withdrawn | تم سحب التقييم',
    title: 'Review will not be published',
    titleAr: 'لن يُنشر التقييم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewWithdrawnEmailText(content: ReviewOutcomeEmailContent): string {
  const english = [
    'Review withdrawn',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');

  const arabic = [
    'تم سحب التقييم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
}

export function buildReviewReplyApprovedEmailHtml(
  content: Omit<ReviewReplyDecisionEmailContent, 'companyEmail'> & {
    appUrl: string;
    reviewsUrl: string;
  },
): string {
  const bodyHtml = `
    ${emailParagraph(`Your reply to the review "${content.reviewTitle}" for ${content.companyName} has been approved and is now visible on your public RateQ profile.`)}
    ${emailButton(content.reviewsUrl, 'View company reviews')}
    ${emailSecondaryLink(content.reviewsUrl, 'Open reviews dashboard')}
    ${emailCallout(
      'Reply published',
      '<p style="margin:0;">Thank you for responding professionally. Your reply helps customers understand your perspective.</p>',
      'success',
    )}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl(`تمت الموافقة على ردكم على التقييم "${content.reviewTitle}" لـ ${content.companyName} وأصبح مرئيًا الآن على ملفكم العام في RateQ.`)}
    ${emailButton(content.reviewsUrl, 'عرض تقييمات الشركة')}
    ${emailSecondaryLink(content.reviewsUrl, 'فتح لوحة التقييمات')}
    ${emailCallout(
      'تم نشر الرد',
      '<p dir="rtl" style="margin:0;text-align:right;">شكرًا لردكم باحترافية. يساعد ردكم العملاء على فهم وجهة نظركم.</p>',
      'success',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your reply for ${content.companyName} is now live. | ردكم لـ ${content.companyName} متاح الآن.`,
    eyebrow: 'Reply approved | تمت الموافقة على الرد',
    title: 'Your reply has been published',
    titleAr: 'تم نشر ردكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewReplyApprovedEmailText(
  content: ReviewReplyDecisionEmailContent,
): string {
  const english = [
    'Your reply has been approved',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
  ].join('\n');

  const arabic = [
    'تمت الموافقة على ردكم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
}

export function buildReviewReplyRejectedEmailHtml(
  content: Omit<ReviewReplyDecisionEmailContent, 'companyEmail'> & {
    appUrl: string;
    reviewsUrl: string;
  },
): string {
  const bodyHtml = `
    ${emailParagraph(`Your reply to the review "${content.reviewTitle}" for ${content.companyName} was not approved and will not be shown on your public RateQ profile.`)}
    ${emailButton(content.reviewsUrl, 'Submit a new reply')}
    ${emailSecondaryLink(content.reviewsUrl, 'Open reviews dashboard')}
    ${emailCallout(
      'You can try again',
      '<p style="margin:0;">You may submit a revised reply from your company reviews dashboard. Please ensure your response is professional and addresses the reviewer\'s feedback.</p>',
      'warning',
    )}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl(`لم تتم الموافقة على ردكم على التقييم "${content.reviewTitle}" لـ ${content.companyName} ولن يظهر على ملفكم العام في RateQ.`)}
    ${emailButton(content.reviewsUrl, 'إرسال رد جديد')}
    ${emailSecondaryLink(content.reviewsUrl, 'فتح لوحة التقييمات')}
    ${emailCallout(
      'يمكنكم المحاولة مجددًا',
      '<p dir="rtl" style="margin:0;text-align:right;">يمكنكم إرسال رد معدّل من لوحة تقييمات شركتكم. يُرجى التأكد من أن ردكم احترافي ويعالج ملاحظات المقيّم.</p>',
      'warning',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your reply for ${content.companyName} was not approved. | لم تتم الموافقة على ردكم لـ ${content.companyName}.`,
    eyebrow: 'Reply update | تحديث الرد',
    title: 'Your reply was not approved',
    titleAr: 'لم تتم الموافقة على ردكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewReplyRejectedEmailText(
  content: ReviewReplyDecisionEmailContent,
): string {
  const english = [
    'Your reply was not approved',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
    '',
    'You can submit a revised reply from your company reviews dashboard.',
  ].join('\n');

  const arabic = [
    'لم تتم الموافقة على ردكم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
    '',
    'يمكنكم إرسال رد معدّل من لوحة تقييمات شركتكم.',
  ].join('\n');

  return appendBilingualText(english, arabic);
}

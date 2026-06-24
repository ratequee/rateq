import { emailParagraphRtl } from './email-bilingual.util';
import {
  appendBilingualText,
  emailCallout,
  emailParagraph,
  escapeHtml,
  renderBilingualEmailLayout,
} from './email-html.util';

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
  const nameAr = content.displayName?.trim() || 'عزيزي المستخدم';

  const companyNote = content.companyName
    ? `<p style="margin:0;">Your company profile <strong>${escapeHtml(content.companyName)}</strong> is no longer visible on RateQ while your account is inactive.</p>`
    : '<p style="margin:0;">You will not be able to sign in, submit reviews, or use dashboard features until your account is reactivated.</p>';

  const companyNoteAr = content.companyName
    ? `<p dir="rtl" style="margin:0;text-align:right;">ملف شركتكم <strong>${escapeHtml(content.companyName)}</strong> لم يعد مرئيًا على RateQ طالما حسابكم غير نشط.</p>`
    : '<p dir="rtl" style="margin:0;text-align:right;">لن تتمكنوا من تسجيل الدخول أو تقديم التقييمات أو استخدام ميزات لوحة التحكم حتى يُعاد تفعيل حسابكم.</p>';

  const bodyHtml = `
    ${emailParagraph(`Hi ${escapeHtml(name)},`)}
    ${emailParagraph('Your RateQ account has been deactivated by an administrator.')}
    ${emailCallout('What this means', companyNote, 'warning')}
    ${emailParagraph('If you believe this was a mistake, please contact RateQ support.')}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl(`مرحبًا ${escapeHtml(nameAr)}،`)}
    ${emailParagraphRtl('تم إلغاء تفعيل حسابكم في RateQ من قِبل أحد المسؤولين.')}
    ${emailCallout('ماذا يعني ذلك؟', companyNoteAr, 'warning')}
    ${emailParagraphRtl('إذا كنتم تعتقدون أن هذا خطأ، يُرجى التواصل مع دعم RateQ.')}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Your RateQ account has been deactivated. | تم إلغاء تفعيل حسابكم في RateQ.',
    eyebrow: 'Account status | حالة الحساب',
    title: 'Account deactivated',
    titleAr: 'تم إلغاء تفعيل الحساب',
    bodyHtml,
    bodyHtmlAr,
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

  const arabicLines = [
    'تم إلغاء تفعيل حسابكم في RateQ.',
    '',
    'لا يمكنكم تسجيل الدخول أو استخدام ميزات RateQ حتى يُعاد تفعيل حسابكم.',
  ];
  if (content.companyName) {
    arabicLines.push('', `ملف الشركة مخفي: ${content.companyName}`);
  }
  arabicLines.push('', 'تواصلوا مع الدعم إذا كنتم تعتقدون أن هذا خطأ.');

  return appendBilingualText(lines.join('\n'), arabicLines.join('\n'));
}

export function buildAccountReactivatedEmailHtml(
  content: AccountStatusEmailContent & { appUrl: string },
): string {
  const name = content.displayName?.trim() || 'there';
  const nameAr = content.displayName?.trim() || 'عزيزي المستخدم';

  const bodyHtml = `
    ${emailParagraph(`Hi ${escapeHtml(name)},`)}
    ${emailParagraph('Good news — your RateQ account has been reactivated. You can sign in and use the platform again.')}
    ${emailCallout(
      'Welcome back',
      '<p style="margin:0;">Sign in to your dashboard to continue using RateQ.</p>',
      'success',
    )}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl(`مرحبًا ${escapeHtml(nameAr)}،`)}
    ${emailParagraphRtl('أخبار سارة — تمت إعادة تفعيل حسابكم في RateQ. يمكنكم تسجيل الدخول واستخدام المنصة مجددًا.')}
    ${emailCallout(
      'مرحبًا بعودتكم',
      '<p dir="rtl" style="margin:0;text-align:right;">سجّلوا الدخول إلى لوحة التحكم لمتابعة استخدام RateQ.</p>',
      'success',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Your RateQ account is active again. | حسابكم في RateQ نشط مجددًا.',
    eyebrow: 'Account status | حالة الحساب',
    title: 'Account reactivated',
    titleAr: 'تمت إعادة تفعيل الحساب',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildAccountReactivatedEmailText(content: AccountStatusEmailContent): string {
  const name = content.displayName?.trim() || 'there';
  const nameAr = content.displayName?.trim() || 'عزيزي المستخدم';

  const english = [
    `Hi ${name},`,
    '',
    'Your RateQ account has been reactivated. You can sign in and use the platform again.',
  ].join('\n');

  const arabic = [
    `مرحبًا ${nameAr}،`,
    '',
    'تمت إعادة تفعيل حسابكم في RateQ. يمكنكم تسجيل الدخول واستخدام المنصة مجددًا.',
  ].join('\n');

  return appendBilingualText(english, arabic);
}

export function buildAccountDeletedEmailHtml(
  content: AccountStatusEmailContent & { appUrl: string },
): string {
  const name = content.displayName?.trim() || 'there';
  const nameAr = content.displayName?.trim() || 'عزيزي المستخدم';

  const bodyHtml = `
    ${emailParagraph(`Hi ${escapeHtml(name)},`)}
    ${emailParagraph('Your RateQ account and associated profile data have been permanently deleted by an administrator.')}
    ${emailCallout(
      'Account removed',
      '<p style="margin:0;">This action cannot be undone. If you wish to use RateQ again, you will need to create a new account.</p>',
      'warning',
    )}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl(`مرحبًا ${escapeHtml(nameAr)}،`)}
    ${emailParagraphRtl('تم حذف حسابكم في RateQ وبيانات الملف المرتبطة به نهائيًا من قِبل أحد المسؤولين.')}
    ${emailCallout(
      'تم حذف الحساب',
      '<p dir="rtl" style="margin:0;text-align:right;">لا يمكن التراجع عن هذا الإجراء. إذا رغبتم في استخدام RateQ مجددًا، ستحتاجون إلى إنشاء حساب جديد.</p>',
      'warning',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Your RateQ account has been deleted. | تم حذف حسابكم في RateQ.',
    eyebrow: 'Account status | حالة الحساب',
    title: 'Account deleted',
    titleAr: 'تم حذف الحساب',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildAccountDeletedEmailText(content: AccountStatusEmailContent): string {
  const name = content.displayName?.trim() || 'there';
  const nameAr = content.displayName?.trim() || 'عزيزي المستخدم';

  const english = [
    `Hi ${name},`,
    '',
    'Your RateQ account and associated profile data have been permanently deleted.',
    'If you wish to use RateQ again, you will need to create a new account.',
  ].join('\n');

  const arabic = [
    `مرحبًا ${nameAr}،`,
    '',
    'تم حذف حسابكم في RateQ وبيانات الملف المرتبطة به نهائيًا.',
    'إذا رغبتم في استخدام RateQ مجددًا، ستحتاجون إلى إنشاء حساب جديد.',
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`تمت إزالة تقييمكم "${escapeHtml(content.reviewTitle)}" لـ ${escapeHtml(content.companyName)} من RateQ من قِبل أحد المسؤولين.`)}
    ${emailCallout(
      'تمت إزالة التقييم',
      '<p dir="rtl" style="margin:0;text-align:right;">يمكنكم تقديم تقييم جديد لهذه الشركة إذا كان لديكم ملاحظات أخرى لمشاركتها.</p>',
      'warning',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your review for ${content.companyName} was removed. | تمت إزالة تقييمكم لـ ${content.companyName}.`,
    eyebrow: 'Review update | تحديث التقييم',
    title: 'Your review was removed',
    titleAr: 'تمت إزالة تقييمكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildReviewDeletedEmailText(content: ReviewDeletedEmailContent): string {
  const english = [
    'Your review was removed',
    '',
    `Review: ${content.reviewTitle}`,
    `Company: ${content.companyName}`,
    '',
    'You may submit a new review for this company if you still have feedback to share.',
  ].join('\n');

  const arabic = [
    'تمت إزالة تقييمكم',
    '',
    `التقييم: ${content.reviewTitle}`,
    `الشركة: ${content.companyName}`,
    '',
    'يمكنكم تقديم تقييم جديد لهذه الشركة إذا كان لديكم ملاحظات أخرى لمشاركتها.',
  ].join('\n');

  return appendBilingualText(english, arabic);
}

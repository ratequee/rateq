import { emailParagraphRtl } from './email-bilingual.util';
import {
  appendBilingualText,
  emailButton,
  emailCallout,
  emailFallbackLink,
  emailParagraph,
  emailSecondaryLink,
  escapeHtml,
  renderBilingualEmailLayout,
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
  const expiresEn = `${content.expiresHours} hour${content.expiresHours === 1 ? '' : 's'}`;
  const expiresAr =
    content.expiresHours === 1
      ? 'ساعة واحدة'
      : content.expiresHours === 2
        ? 'ساعتين'
        : `${content.expiresHours} ساعات`;

  const bodyHtml = `
    ${emailParagraph("Welcome to RateQ — Qatar's trusted review platform. Confirm your email to activate your account and start exploring verified businesses and reviews.")}
    ${emailButton(content.verifyUrl, 'Verify email address')}
    ${emailSecondaryLink(content.verifyUrl, 'Open verification link')}
    ${emailFallbackLink(content.verifyUrl)}
    ${emailCallout(
      'Link expires soon',
      `<p style="margin:0;">This verification link expires in <strong>${expiresEn}</strong>. If you did not create a RateQ account, you can safely ignore this email.</p>`,
      'info',
    )}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl('مرحبًا بك في RateQ — منصة التقييمات الموثوقة في قطر. أكّد بريدك الإلكتروني لتفعيل حسابك والبدء في استكشاف الشركات والتقييمات الموثّقة.')}
    ${emailButton(content.verifyUrl, 'تأكيد البريد الإلكتروني')}
    ${emailSecondaryLink(content.verifyUrl, 'فتح رابط التأكيد')}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader:
      'Confirm your email to activate your RateQ account. | أكّد بريدك الإلكتروني لتفعيل حسابك في RateQ.',
    eyebrow: 'Account verification | التحقق من الحساب',
    title: 'Verify your email address',
    titleAr: 'تأكيد بريدك الإلكتروني',
    bodyHtml,
    bodyHtmlAr: `${bodyHtmlAr}
    ${emailCallout(
      'ينتهي الرابط قريبًا',
      `<p dir="rtl" style="margin:0;text-align:right;">ينتهي صلاحية رابط التأكيد خلال <strong>${expiresAr}</strong>. إذا لم تقم بإنشاء حساب في RateQ، يمكنك تجاهل هذه الرسالة بأمان.</p>`,
      'info',
    )}`,
    footerNote:
      'You received this email because a RateQ account was created with this address. | تلقيت هذه الرسالة لأنه تم إنشاء حساب RateQ باستخدام هذا البريد الإلكتروني.',
  });
}

export function buildVerificationEmailText(content: VerificationEmailContent): string {
  const english = [
    'Welcome to RateQ',
    '',
    'Verify your email address to activate your account:',
    content.verifyUrl,
    '',
    `This link expires in ${content.expiresHours} hour(s).`,
    '',
    'If you did not create a RateQ account, you can ignore this email.',
  ].join('\n');

  const arabic = [
    'مرحبًا بك في RateQ',
    '',
    'أكّد بريدك الإلكتروني لتفعيل حسابك:',
    content.verifyUrl,
    '',
    `ينتهي صلاحية هذا الرابط خلال ${content.expiresHours} ساعة/ساعات.`,
    '',
    'إذا لم تقم بإنشاء حساب في RateQ، يمكنك تجاهل هذه الرسالة.',
  ].join('\n');

  return appendBilingualText(english, arabic);
}

export function buildPasswordResetEmailHtml(content: PasswordResetEmailContent): string {
  const expiresEn = `${content.expiresHours} hour${content.expiresHours === 1 ? '' : 's'}`;
  const expiresAr =
    content.expiresHours === 1
      ? 'ساعة واحدة'
      : content.expiresHours === 2
        ? 'ساعتين'
        : `${content.expiresHours} ساعات`;

  const bodyHtml = `
    ${emailParagraph('We received a request to reset the password for your RateQ account. Use the button below to choose a new password.')}
    ${emailButton(content.resetUrl, 'Reset password')}
    ${emailSecondaryLink(content.resetUrl, 'Open password reset link')}
    ${emailFallbackLink(content.resetUrl)}
    ${emailCallout(
      'Did not request this?',
      `<p style="margin:0;">If you did not ask to reset your password, no action is needed — your account remains secure. This link expires in <strong>${expiresEn}</strong>.</p>`,
      'warning',
    )}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl('تلقّينا طلبًا لإعادة تعيين كلمة المرور لحسابك في RateQ. استخدم الزر أدناه لاختيار كلمة مرور جديدة.')}
    ${emailButton(content.resetUrl, 'إعادة تعيين كلمة المرور')}
    ${emailSecondaryLink(content.resetUrl, 'فتح رابط إعادة التعيين')}
    ${emailCallout(
      'لم تطلب ذلك؟',
      `<p dir="rtl" style="margin:0;text-align:right;">إذا لم تطلب إعادة تعيين كلمة المرور، فلا حاجة لأي إجراء — حسابك آمن. ينتهي صلاحية هذا الرابط خلال <strong>${expiresAr}</strong>.</p>`,
      'warning',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: 'Reset your RateQ password securely. | أعد تعيين كلمة مرور RateQ بأمان.',
    eyebrow: 'Security | الأمان',
    title: 'Reset your password',
    titleAr: 'إعادة تعيين كلمة المرور',
    bodyHtml,
    bodyHtmlAr,
    footerNote:
      'You received this email because a password reset was requested for your account. | تلقيت هذه الرسالة لأنه تم طلب إعادة تعيين كلمة المرور لحسابك.',
  });
}

export function buildPasswordResetEmailText(content: PasswordResetEmailContent): string {
  const english = [
    'Reset your RateQ password',
    '',
    'Use this link to choose a new password:',
    content.resetUrl,
    '',
    `This link expires in ${content.expiresHours} hour(s).`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const arabic = [
    'إعادة تعيين كلمة مرور RateQ',
    '',
    'استخدم هذا الرابط لاختيار كلمة مرور جديدة:',
    content.resetUrl,
    '',
    `ينتهي صلاحية هذا الرابط خلال ${content.expiresHours} ساعة/ساعات.`,
    '',
    'إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.',
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`أخبار رائعة — تمت مراجعة ملف شركتك ${content.companyName} والموافقة عليه.`)}
    ${emailCallout(
      'أنتم متاحون على RateQ',
      `<p dir="rtl" style="margin:0;text-align:right;">يمكن للعملاء الآن اكتشاف <strong>${safeCompany}</strong> وقراءة ملفكم وترك تقييمات موثّقة. انتقلوا إلى لوحة التحكم لإدارة حضوركم.</p>`,
      'success',
    )}
    ${emailButton(content.dashboardUrl, 'فتح لوحة تحكم الشركة')}
    ${emailSecondaryLink(content.dashboardUrl, 'الانتقال إلى لوحة التحكم')}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your company profile for ${content.companyName} has been approved. | تمت الموافقة على ملف شركتكم ${content.companyName}.`,
    eyebrow: 'Company verification | التحقق من الشركة',
    title: 'Profile approved',
    titleAr: 'تمت الموافقة على الملف',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildCompanyApprovedEmailText(content: CompanyApprovedEmailContent): string {
  const english = [
    'Your RateQ company profile has been approved',
    '',
    `Company: ${content.companyName}`,
    '',
    `Open your dashboard: ${content.dashboardUrl}`,
  ].join('\n');

  const arabic = [
    'تمت الموافقة على ملف شركتكم في RateQ',
    '',
    `الشركة: ${content.companyName}`,
    '',
    `افتحوا لوحة التحكم: ${content.dashboardUrl}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`بعد المراجعة، لم تتم الموافقة على ملف شركتكم ${content.companyName} وتمت إزالته من RateQ.`)}
    ${emailCallout(
      'ما الخطوة التالية؟',
      `<p dir="rtl" style="margin:0;text-align:right;">يمكنكم تسجيل الدخول وتقديم ملف شركة جديد بمعلومات محدّثة. تأكدوا من أن مستنداتكم واضحة وصالحة ومطابقة لبيانات السجل التجاري لـ <strong>${safeCompany}</strong>.</p>`,
      'danger',
    )}
    ${emailButton(content.profileUrl, 'تسجيل ملف الشركة')}
    ${emailSecondaryLink(content.profileUrl, 'إكمال الملف')}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Your company profile for ${content.companyName} was not approved. | لم تتم الموافقة على ملف شركتكم ${content.companyName}.`,
    eyebrow: 'Company verification | التحقق من الشركة',
    title: 'Profile not approved',
    titleAr: 'لم تتم الموافقة على الملف',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildCompanyRejectedEmailText(content: CompanyRejectedEmailContent): string {
  const english = [
    'Your RateQ company profile was not approved',
    '',
    `Company: ${content.companyName}`,
    '',
    'Your submission has been removed. You may register a new company profile after signing in:',
    content.profileUrl,
  ].join('\n');

  const arabic = [
    'لم تتم الموافقة على ملف شركتكم في RateQ',
    '',
    `الشركة: ${content.companyName}`,
    '',
    'تمت إزالة طلبكم. يمكنكم تسجيل ملف شركة جديد بعد تسجيل الدخول:',
    content.profileUrl,
  ].join('\n');

  return appendBilingualText(english, arabic);
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

  const bodyHtmlAr = `
    ${emailParagraphRtl(`ملف شركتكم ${content.companyName} على وشك الاكتمال — يحتاج فريقنا إلى بعض التحديثات قبل الموافقة عليه.`)}
    ${emailCallout('التعديلات المطلوبة', `<p dir="rtl" style="margin:0;text-align:right;">${notesHtml}</p>`, 'warning')}
    ${emailParagraphRtl('حدّثوا مستنداتكم وبياناتكم، ثم أعيدوا تقديم الملف للمراجعة.')}
    ${emailButton(content.profileUrl, 'تحديث ملف الشركة')}
    ${emailSecondaryLink(content.profileUrl, 'فتح صفحة إكمال الملف')}
    ${emailCallout(
      'ملف الشركة',
      `<p dir="rtl" style="margin:0;text-align:right;"><strong>${safeCompany}</strong></p>`,
      'info',
    )}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: `Updates required for ${content.companyName} before approval. | مطلوب تحديثات لـ ${content.companyName} قبل الموافقة.`,
    eyebrow: 'Action required | إجراء مطلوب',
    title: 'Updates required on your profile',
    titleAr: 'مطلوب تحديثات على ملفكم',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildCompanyRevisionEmailText(content: CompanyRevisionEmailContent): string {
  const english = [
    'Updates required for your RateQ company profile',
    '',
    `Company: ${content.companyName}`,
    '',
    'Requested changes:',
    content.revisionNotes,
    '',
    `Update your profile: ${content.profileUrl}`,
  ].join('\n');

  const arabic = [
    'مطلوب تحديثات على ملف شركتكم في RateQ',
    '',
    `الشركة: ${content.companyName}`,
    '',
    'التعديلات المطلوبة:',
    content.revisionNotes,
    '',
    `حدّثوا ملفكم: ${content.profileUrl}`,
  ].join('\n');

  return appendBilingualText(english, arabic);
}

export interface UserInvitationEmailContent {
  registerUrl: string;
  invitationType: 'company' | 'reviewer';
  companyName?: string;
}

export function buildUserInvitationEmailHtml(
  content: UserInvitationEmailContent & { appUrl: string },
): string {
  const isCompany = content.invitationType === 'company';
  const introEn = isCompany
    ? 'You have been invited to register your company on RateQ.'
    : `You have been invited to join RateQ and review ${content.companyName ?? 'a company'}.`;
  const introAr = isCompany
    ? 'تمت دعوتكم لتسجيل شركتكم على منصة RateQ.'
    : `تمت دعوتكم للانضمام إلى RateQ ومراجعة ${content.companyName ?? 'شركة'}.`;

  const bodyHtml = `
    ${emailParagraph(introEn)}
    ${emailParagraph('Create your account using the button below to get started.')}
    ${emailButton(content.registerUrl, 'Create your account')}
    ${emailSecondaryLink(content.registerUrl, 'Open registration link')}
    ${emailFallbackLink(content.registerUrl)}
  `;

  const bodyHtmlAr = `
    ${emailParagraphRtl(introAr)}
    ${emailParagraphRtl('أنشئوا حسابكم باستخدام الزر أدناه للبدء.')}
    ${emailButton(content.registerUrl, 'إنشاء حساب')}
    ${emailSecondaryLink(content.registerUrl, 'فتح رابط التسجيل')}
  `;

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: isCompany
      ? 'You are invited to register your company on RateQ.'
      : 'You are invited to join RateQ as a reviewer.',
    eyebrow: 'Invitation | دعوة',
    title: 'You are invited to RateQ',
    titleAr: 'أنتم مدعوون إلى RateQ',
    bodyHtml,
    bodyHtmlAr,
  });
}

export function buildUserInvitationEmailText(content: UserInvitationEmailContent): string {
  const english = ['You are invited to RateQ', '', `Register: ${content.registerUrl}`].join('\n');
  const arabic = ['أنتم مدعوون إلى RateQ', '', `التسجيل: ${content.registerUrl}`].join('\n');
  return appendBilingualText(english, arabic);
}

import { bilingualSubject, emailParagraphRtlHtml } from './email-bilingual.util';
import {
  appendBilingualText,
  emailButton,
  emailParagraphHtml,
  escapeHtml,
  renderBilingualEmailLayout,
} from './email-html.util';

export interface MarketingEmailContent {
  appUrl: string;
  subjectEn: string;
  subjectAr: string;
  headingEn: string;
  headingAr: string;
  messageEn: string;
  messageAr: string;
  ctaLabelEn?: string;
  ctaLabelAr?: string;
  ctaUrl?: string;
}

function formatMessageHtml(message: string): string {
  return escapeHtml(message.trim()).replace(/\n/g, '<br />');
}

function buildCtaBlocks(content: MarketingEmailContent): {
  en: string;
  ar: string;
} {
  if (!content.ctaUrl?.trim()) {
    return { en: '', ar: '' };
  }

  const url = content.ctaUrl.trim();
  return {
    en: content.ctaLabelEn?.trim() ? emailButton(url, content.ctaLabelEn.trim()) : '',
    ar: content.ctaLabelAr?.trim()
      ? `<div dir="rtl" style="text-align:center;margin-top:8px;">${emailButton(url, content.ctaLabelAr.trim())}</div>`
      : '',
  };
}

export function buildMarketingEmailHtml(content: MarketingEmailContent): string {
  const cta = buildCtaBlocks(content);

  const bodyHtmlEn = `
    ${emailParagraphHtml(formatMessageHtml(content.messageEn))}
    ${cta.en}
  `.trim();

  const bodyHtmlAr = `
    ${emailParagraphRtlHtml(formatMessageHtml(content.messageAr))}
    ${cta.ar}
  `.trim();

  return renderBilingualEmailLayout({
    appUrl: content.appUrl,
    preheader: content.headingEn,
    eyebrow: 'RateQ Update',
    title: content.headingEn,
    titleAr: content.headingAr,
    bodyHtml: bodyHtmlEn,
    bodyHtmlAr: bodyHtmlAr,
    footerNote: 'You received this message from RateQ. | تلقيت هذه الرسالة من RateQ.',
  });
}

export function buildMarketingEmailText(content: MarketingEmailContent): string {
  const english = [
    content.headingEn,
    '',
    content.messageEn.trim(),
    content.ctaLabelEn && content.ctaUrl ? `\n${content.ctaLabelEn}: ${content.ctaUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const arabic = [
    content.headingAr,
    '',
    content.messageAr.trim(),
    content.ctaLabelAr && content.ctaUrl ? `\n${content.ctaLabelAr}: ${content.ctaUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return appendBilingualText(english, arabic);
}

export function buildMarketingEmailSubject(content: MarketingEmailContent): string {
  return bilingualSubject(content.subjectEn.trim(), content.subjectAr.trim());
}

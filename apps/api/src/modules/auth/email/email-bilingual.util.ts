import { emailParagraph, escapeHtml } from './email-html.util';

export function bilingualSubject(english: string, arabic: string): string {
  return `${english} | ${arabic}`;
}

export function emailParagraphRtl(text: string): string {
  return `<p dir="rtl" style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;color:#373737;text-align:right;">${escapeHtml(text)}</p>`;
}

export function emailBilingualBlock(englishHtml: string, arabicHtml: string): string {
  return `
    <div style="margin-bottom:8px;">
      <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:1.4;color:#8E2157;letter-spacing:0.08em;text-transform:uppercase;">
        English
      </p>
      ${englishHtml}
    </div>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb;" />
    <div>
      <p dir="rtl" style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:1.4;color:#8E2157;letter-spacing:0.08em;text-transform:uppercase;text-align:right;">
        العربية
      </p>
      <div dir="rtl" style="text-align:right;">
        ${arabicHtml}
      </div>
    </div>
  `.trim();
}

export function bilingualParagraph(english: string, arabic: string): string {
  return emailBilingualBlock(emailParagraph(english), emailParagraphRtl(arabic));
}

export function bilingualTitle(english: string, arabic: string): string {
  return `${escapeHtml(english)}<br/><span dir="rtl" style="display:block;margin-top:8px;font-size:22px;line-height:1.4;text-align:right;">${escapeHtml(arabic)}</span>`;
}

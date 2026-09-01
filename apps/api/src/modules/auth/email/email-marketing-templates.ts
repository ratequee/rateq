import { escapeHtml, renderEmailLayout } from './email-html.util';

export interface MarketingEmailContent {
  appUrl: string;
  heading: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function formatMessageHtml(message: string): string {
  return escapeHtml(message.trim()).replace(/\n/g, '<br />');
}

function formatMessageText(message: string): string {
  return message.trim();
}

export function buildMarketingEmailHtml(content: MarketingEmailContent): string {
  const ctaBlock =
    content.ctaLabel && content.ctaUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto 8px;">
          <tr>
            <td align="center" style="border-radius:9999px;background:#e8b84d;box-shadow:0 8px 24px rgba(232,184,77,0.35);">
              <a href="${escapeHtml(content.ctaUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1.2;color:#373737;text-decoration:none;border-radius:9999px;">
                ${escapeHtml(content.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
      `.trim()
      : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#373737;">
      ${formatMessageHtml(content.message)}
    </p>
    ${ctaBlock}
  `.trim();

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: content.heading,
    title: content.heading,
    bodyHtml,
    footerNote: 'You received this message from RateQ.',
  });
}

export function buildMarketingEmailText(content: MarketingEmailContent): string {
  const lines = [content.heading, '', formatMessageText(content.message)];

  if (content.ctaLabel && content.ctaUrl) {
    lines.push('', `${content.ctaLabel}: ${content.ctaUrl}`);
  }

  lines.push('', '—', 'RateQ', content.appUrl);
  return lines.join('\n');
}

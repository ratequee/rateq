export interface EmailLayoutOptions {
  appUrl: string;
  preheader: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
}

const BRAND_PRIMARY = '#8E2157';
const BRAND_DARK = '#5a0f1c';
const GOLD = '#e8b84d';
const INK = '#373737';
const INK_MUTED = '#6b7280';
const SURFACE = '#ffffff';
const PAGE_BG = '#f3f4f6';

/** White wordmark on brand header — hosted on Firebase Storage. */
export const EMAIL_LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/rateq-2dc6d.firebasestorage.app/o/assets%2Fwhite_logo.svg?alt=media&token=5f023ba3-6352-469c-baae-273a1dbd2eef';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function emailButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto 8px;">
      <tr>
        <td align="center" style="border-radius:9999px;background:${GOLD};box-shadow:0 8px 24px rgba(232,184,77,0.35);">
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1.2;color:${INK};text-decoration:none;border-radius:9999px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

export function emailSecondaryLink(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);

  return `
    <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${INK_MUTED};text-align:center;">
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:${BRAND_PRIMARY};text-decoration:underline;font-weight:600;">
        ${safeLabel}
      </a>
    </p>
  `.trim();
}

export function emailFallbackLink(href: string): string {
  const safeHref = escapeHtml(href);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
      <tr>
        <td style="padding:16px 18px;border-radius:12px;background:#fdf2f3;border:1px solid #f9c8cf;">
          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${INK_MUTED};">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;word-break:break-all;">
            <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:${BRAND_PRIMARY};text-decoration:none;">
              ${safeHref}
            </a>
          </p>
        </td>
      </tr>
    </table>
  `.trim();
}

type EmailCalloutVariant = 'info' | 'success' | 'warning' | 'danger';

const CALLOUT_STYLES: Record<EmailCalloutVariant, { bg: string; border: string; accent: string }> =
  {
    info: { bg: '#f8fafc', border: '#e2e8f0', accent: BRAND_PRIMARY },
    success: { bg: '#ecfdf5', border: '#a7f3d0', accent: '#047857' },
    warning: { bg: '#fffbeb', border: '#fde68a', accent: '#b45309' },
    danger: { bg: '#fef2f2', border: '#fecaca', accent: '#b91c1c' },
  };

export function emailCallout(
  title: string,
  contentHtml: string,
  variant: EmailCalloutVariant = 'info',
): string {
  const style = CALLOUT_STYLES[variant];
  const safeTitle = escapeHtml(title);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0;">
      <tr>
        <td style="padding:18px 20px;border-radius:14px;background:${style.bg};border:1px solid ${style.border};border-left:4px solid ${style.accent};">
          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;line-height:1.4;color:${INK};">
            ${safeTitle}
          </p>
          <div style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${INK};">
            ${contentHtml}
          </div>
        </td>
      </tr>
    </table>
  `.trim();
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${INK};">${escapeHtml(text)}</p>`;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const year = new Date().getFullYear();
  const safeAppUrl = escapeHtml(options.appUrl);
  const safePreheader = escapeHtml(options.preheader);
  const safeEyebrow = options.eyebrow ? escapeHtml(options.eyebrow) : '';
  const safeTitle = escapeHtml(options.title);
  const safeLogoUrl = escapeHtml(EMAIL_LOGO_URL);
  const footerNote = options.footerNote
    ? `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${INK_MUTED};">${escapeHtml(options.footerNote)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body { padding: 28px 22px !important; }
      .email-header { padding: 28px 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${safePreheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;">
          <tr>
            <td class="email-header" align="center" style="padding:36px 40px 32px;border-radius:20px 20px 0 0;background:linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_DARK} 100%);">
              <a href="${safeAppUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <!--[if mso]>
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">RateQ</span>
                <![endif]-->
                <!--[if !mso]><!-->
                <img
                  src="${safeLogoUrl}"
                  alt="RateQ"
                  width="140"
                  height="36"
                  style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;max-width:140px;width:140px;height:auto;"
                />
                <!--<![endif]-->
              </a>
              <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.88);">
                Trusted reviews, transparent ratings
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:40px;background:${SURFACE};border-left:1px solid #ececec;border-right:1px solid #ececec;box-shadow:0 12px 40px rgba(17,24,39,0.08);">
              ${
                safeEyebrow
                  ? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;line-height:1.4;color:${BRAND_PRIMARY};letter-spacing:0.08em;text-transform:uppercase;">
                ${safeEyebrow}
              </p>`
                  : ''
              }
              <h1 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;line-height:1.25;color:${INK};letter-spacing:-0.4px;">
                ${safeTitle}
              </h1>
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 1px;background:${SURFACE};border-left:1px solid #ececec;border-right:1px solid #ececec;border-bottom:1px solid #ececec;border-radius:0 0 20px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg, ${GOLD}, ${BRAND_PRIMARY});border-radius:0 0 20px 20px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 12px 8px;">
              ${footerNote}
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${INK_MUTED};">
                © ${year} RateQ · Qatar
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${INK_MUTED};">
                <a href="${safeAppUrl}" target="_blank" rel="noopener noreferrer" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">Visit RateQ</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

import {
  emailButton,
  emailCallout,
  emailParagraph,
  escapeHtml,
  renderEmailLayout,
} from '../../auth/email/email-html.util';

export interface CompanyRegistrationPendingEmailContent {
  appUrl: string;
  companyName: string;
  ownerEmail: string;
  city?: string | null;
  country?: string | null;
}

export interface CompanyProjectPendingEmailContent {
  appUrl: string;
  companyName: string;
  ownerEmail: string;
  projectCount: number;
  projectTitles: string[];
}

export function buildCompanyRegistrationPendingEmailHtml(
  content: CompanyRegistrationPendingEmailContent,
): string {
  const company = escapeHtml(content.companyName);
  const ownerEmail = escapeHtml(content.ownerEmail);
  const location = [content.city, content.country].filter(Boolean).map(String).join(', ');
  const reviewUrl = `${content.appUrl.replace(/\/$/, '')}/dashboard/admin/companies`;

  const bodyHtml = `
    ${emailParagraph('A company completed registration and is waiting for admin verification.')}
    ${emailCallout(
      'Company details',
      `<p style="margin:0;"><strong>Company:</strong> ${company}<br/><strong>Owner email:</strong> <a href="mailto:${ownerEmail}" style="color:#8E2157;text-decoration:none;">${ownerEmail}</a>${
        location ? `<br/><strong>Location:</strong> ${escapeHtml(location)}` : ''
      }</p>`,
      'info',
    )}
    ${emailButton(reviewUrl, 'Review company')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `New company pending approval: ${content.companyName}`,
    eyebrow: 'Admin action needed',
    title: 'New company registration pending approval',
    bodyHtml,
    footerNote: 'Open the admin dashboard to approve, reject, or request revisions.',
  });
}

export function buildCompanyRegistrationPendingEmailText(
  content: CompanyRegistrationPendingEmailContent,
): string {
  const location = [content.city, content.country].filter(Boolean).join(', ');
  return [
    'New company registration pending approval',
    '',
    `Company: ${content.companyName}`,
    `Owner email: ${content.ownerEmail}`,
    ...(location ? [`Location: ${location}`] : []),
    '',
    `Review: ${content.appUrl.replace(/\/$/, '')}/dashboard/admin/companies`,
  ].join('\n');
}

export function buildCompanyProjectPendingEmailHtml(
  content: CompanyProjectPendingEmailContent,
): string {
  const company = escapeHtml(content.companyName);
  const ownerEmail = escapeHtml(content.ownerEmail);
  const titles = content.projectTitles
    .slice(0, 8)
    .map((title) => escapeHtml(title))
    .join('<br/>');
  const reviewUrl = `${content.appUrl.replace(/\/$/, '')}/dashboard/admin/projects`;

  const bodyHtml = `
    ${emailParagraph(
      'A verified company submitted project updates that require admin approval before they appear publicly.',
    )}
    ${emailCallout(
      'Submission details',
      `<p style="margin:0;"><strong>Company:</strong> ${company}<br/><strong>Owner email:</strong> <a href="mailto:${ownerEmail}" style="color:#8E2157;text-decoration:none;">${ownerEmail}</a><br/><strong>Projects submitted:</strong> ${content.projectCount}</p>`,
      'info',
    )}
    ${titles ? emailCallout('Project titles', `<p style="margin:0;">${titles}</p>`, 'warning') : ''}
    ${emailButton(reviewUrl, 'Review projects')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `Projects pending approval from ${content.companyName}`,
    eyebrow: 'Admin action needed',
    title: 'Company projects pending approval',
    bodyHtml,
    footerNote: 'Open the admin projects queue to approve or reject these projects.',
  });
}

export function buildCompanyProjectPendingEmailText(
  content: CompanyProjectPendingEmailContent,
): string {
  return [
    'Company projects pending approval',
    '',
    `Company: ${content.companyName}`,
    `Owner email: ${content.ownerEmail}`,
    `Projects submitted: ${content.projectCount}`,
    ...(content.projectTitles.length
      ? ['', 'Project titles:', ...content.projectTitles.map((title) => `- ${title}`)]
      : []),
    '',
    `Review: ${content.appUrl.replace(/\/$/, '')}/dashboard/admin/projects`,
  ].join('\n');
}

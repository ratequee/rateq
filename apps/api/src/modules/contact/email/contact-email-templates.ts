import {
  emailCallout,
  emailParagraph,
  escapeHtml,
  renderEmailLayout,
} from '../../auth/email/email-html.util';

export interface ContactFormEmailContent {
  appUrl: string;
  name: string;
  email: string;
  phone: string;
  subjectLabel: string;
  message: string;
}

export function buildContactFormEmailHtml(content: ContactFormEmailContent): string {
  const safeName = escapeHtml(content.name);
  const safeEmail = escapeHtml(content.email);
  const safePhone = escapeHtml(content.phone);
  const safeSubject = escapeHtml(content.subjectLabel);
  const messageHtml = escapeHtml(content.message).replace(/\n/g, '<br/>');

  const bodyHtml = `
    ${emailParagraph('A new message was submitted through the RateQ contact form. Reply directly to the sender using their email address.')}
    ${emailCallout(
      'Sender details',
      `<p style="margin:0;"><strong>Name:</strong> ${safeName}<br/><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color:#8E2157;text-decoration:none;">${safeEmail}</a><br/><strong>Phone:</strong> ${safePhone}<br/><strong>Subject:</strong> ${safeSubject}</p>`,
      'info',
    )}
    ${emailCallout('Message', `<p style="margin:0;">${messageHtml}</p>`, 'warning')}
  `;

  return renderEmailLayout({
    appUrl: content.appUrl,
    preheader: `New contact form message from ${content.name}`,
    eyebrow: 'Contact form',
    title: 'New website inquiry',
    bodyHtml,
    footerNote: `Submitted by ${content.name} (${content.email}).`,
  });
}

export function buildContactFormEmailText(content: ContactFormEmailContent): string {
  return [
    'New RateQ contact form message',
    '',
    `Name: ${content.name}`,
    `Email: ${content.email}`,
    `Phone: ${content.phone}`,
    `Subject: ${content.subjectLabel}`,
    '',
    'Message:',
    content.message,
  ].join('\n');
}

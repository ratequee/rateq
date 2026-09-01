import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';

export interface SendMarketingEmailInput {
  recipients: string[];
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

export interface MarketingEmailSendResult {
  sent: number;
  failed: { email: string; reason: string }[];
}

async function token(): Promise<string> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }
  return accessToken;
}

export const adminEmailMarketingApi = {
  send: async (data: SendMarketingEmailInput) =>
    apiClient<MarketingEmailSendResult>('/admin/email-marketing/send', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),
};

import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';

export interface SendMarketingEmailInput {
  recipients: string[];
  subject: string;
  heading: string;
  message: string;
  ctaLabel?: string;
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

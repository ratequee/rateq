import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { MessageResponse } from '@rateq/types';

type PhoneVerificationContext = 'reviewer' | 'company';

async function token(): Promise<string> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }
  return accessToken;
}

export const phoneVerificationApi = {
  syncPhone: async (phone: string, context: PhoneVerificationContext) =>
    apiClient<MessageResponse>('/users/me/phone/sync', {
      method: 'POST',
      body: JSON.stringify({ phone, context }),
      token: await token(),
    }),
};

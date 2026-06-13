import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import type { MessageResponse } from '@rateq/types';

async function token(): Promise<string> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }
  return accessToken;
}

export const phoneVerificationApi = {
  sendOtp: async (phone: string, context: 'reviewer' | 'company') =>
    apiClient<MessageResponse>('/users/me/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, context }),
      token: await token(),
    }),

  verifyOtp: async (code: string, context: 'reviewer' | 'company') =>
    apiClient<MessageResponse>('/users/me/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ code, context }),
      token: await token(),
    }),
};

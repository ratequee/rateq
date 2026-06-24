import type {
  CompleteReviewerProfileInput,
  CreateCompanyInput,
  InvitationPublic,
  OnboardingStatus,
  SendInvitationInput,
  UpdateCompanyInput,
} from '@rateq/types';
import type { CompanyDetail } from '@rateq/types';
import { apiClient } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';

async function token(): Promise<string> {
  const accessToken = await ensureValidAccessToken();
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }
  return accessToken;
}

export const onboardingApi = {
  getStatus: async () =>
    apiClient<OnboardingStatus>('/users/me/onboarding', { token: await token() }),

  completeReviewer: async (data: CompleteReviewerProfileInput) =>
    apiClient<OnboardingStatus>('/users/me/profile/reviewer', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: await token(),
    }),

  registerCompany: async (data: CreateCompanyInput) =>
    apiClient<CompanyDetail>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),

  updateCompany: async (data: UpdateCompanyInput) =>
    apiClient<CompanyDetail>('/companies/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: await token(),
    }),

  listReviewerInvitations: async () =>
    apiClient<InvitationPublic[]>('/companies/me/invitations/reviewers', {
      token: await token(),
    }),

  inviteReviewer: async (data: SendInvitationInput) =>
    apiClient<InvitationPublic>('/companies/me/invitations/reviewers', {
      method: 'POST',
      body: JSON.stringify(data),
      token: await token(),
    }),
};

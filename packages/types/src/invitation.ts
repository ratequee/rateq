export type InvitationType = 'company' | 'reviewer';

export interface SendInvitationInput {
  email: string;
}

export interface InvitationPublic {
  id: string;
  email: string;
  type: InvitationType;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

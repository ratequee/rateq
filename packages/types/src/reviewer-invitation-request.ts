export type ReviewerInvitationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewerInvitationRequestPublic {
  id: string;
  companyId: string;
  companyName?: string;
  reviewerName: string;
  email: string;
  serviceProvided: string;
  proofUrls: string[];
  status: ReviewerInvitationRequestStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CreateReviewerInvitationRequestInput {
  reviewerName: string;
  email: string;
  serviceProvided: string;
  proofUrls: string[];
}

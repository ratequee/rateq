import type { Review, ReviewReply, User, UserProfile } from '@prisma/client';
import type { ReviewPublic, ReviewReplyPublic } from '@rateq/types';
import { ReviewStatus } from '@rateq/types';

type ReviewWithRelations = Review & {
  user?: Pick<User, 'id' | 'email' | 'displayName'> & {
    profile?: Pick<UserProfile, 'fullName' | 'avatarUrl'> | null;
  };
  replies?: ReviewReply[];
};

export function toReviewReplyPublic(reply: ReviewReply): ReviewReplyPublic {
  return {
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  };
}

function resolveAuthorDisplayName(user: NonNullable<ReviewWithRelations['user']>): string {
  const fromProfile = user.profile?.fullName?.trim();
  if (fromProfile) return fromProfile;

  const fromAccount = user.displayName?.trim();
  if (fromAccount) return fromAccount;

  const localPart = user.email.split('@')[0]?.trim();
  return localPart || user.email;
}

export function toReviewPublic(review: ReviewWithRelations): ReviewPublic {
  const reply = review.replies?.[0];

  return {
    id: review.id,
    companyId: review.companyId,
    userId: review.userId,
    rating: review.rating,
    title: review.title,
    content: review.content,
    status: review.status as ReviewStatus,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    ...(review.user && {
      author: {
        id: review.user.id,
        displayName: resolveAuthorDisplayName(review.user),
        avatarUrl: review.user.profile?.avatarUrl ?? null,
      },
    }),
    reply: reply ? toReviewReplyPublic(reply) : null,
  };
}

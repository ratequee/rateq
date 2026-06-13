import type {
  Review,
  ReviewReply,
  ReviewAttachment,
  ReviewServiceRating,
  User,
  UserProfile,
} from '@prisma/client';
import type {
  ReviewAttachmentPublic,
  ReviewPublic,
  ReviewReplyPublic,
  ReviewServiceRatingPublic,
} from '@rateq/types';
import { ReviewStatus } from '@rateq/types';

type ReviewWithRelations = Review & {
  user?: Pick<User, 'id' | 'email' | 'displayName'> & {
    profile?: Pick<UserProfile, 'fullName' | 'avatarUrl'> | null;
  };
  replies?: ReviewReply[];
  attachments?: ReviewAttachment[];
  serviceRatings?: (ReviewServiceRating & {
    categoryService?: { id: string; name: string };
  })[];
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

  const serviceRatings: ReviewServiceRatingPublic[] | undefined = review.serviceRatings?.length
    ? review.serviceRatings.map((entry) => ({
        categoryServiceId: entry.categoryServiceId,
        serviceName: entry.categoryService?.name ?? 'Service',
        rating: entry.rating,
      }))
    : undefined;

  const attachments: ReviewAttachmentPublic[] | undefined = review.attachments?.length
    ? review.attachments.map((attachment) => ({
        id: attachment.id,
        url: attachment.url,
        fileName: attachment.fileName,
      }))
    : undefined;

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
    ...(serviceRatings && { serviceRatings }),
    ...(attachments && { attachments }),
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

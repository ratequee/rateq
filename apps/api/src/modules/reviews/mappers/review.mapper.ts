import type {
  Review,
  ReviewReply,
  ReviewAttachment,
  ReviewServiceRating,
  User,
  UserProfile,
  Company,
  Category,
} from '@prisma/client';
import type {
  ReviewAttachmentPublic,
  ReviewCompanySummary,
  ReviewPublic,
  ReviewReplyPublic,
  ReviewReplyStatus,
  ReviewServiceRatingPublic,
} from '@rateq/types';
import { ReviewReplyStatus as ReviewReplyStatusEnum, ReviewStatus } from '@rateq/types';

type ReviewWithRelations = Review & {
  user?: Pick<User, 'id' | 'email' | 'displayName' | 'phone' | 'phoneVerified'> & {
    profile?: Pick<UserProfile, 'fullName' | 'avatarUrl' | 'phone'> | null;
  };
  company?: Pick<Company, 'id' | 'name' | 'slug' | 'logo' | 'categoryId' | 'email'> & {
    owner?: { id: string; email: string } | null;
    category?: Pick<Category, 'id' | 'nameEn' | 'nameAr'> | null;
  };
  replies?: ReviewReply[];
  attachments?: ReviewAttachment[];
  serviceRatings?: (ReviewServiceRating & {
    companyCatalogItem?: { id: string; nameEn: string; nameAr: string };
  })[];
};

export function toReviewReplyPublic(reply: ReviewReply): ReviewReplyPublic {
  return {
    id: reply.id,
    content: reply.content,
    status: reply.status as ReviewReplyStatus,
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

function toReviewCompanySummary(
  company: NonNullable<ReviewWithRelations['company']>,
): ReviewCompanySummary {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    logo: company.logo,
    categoryId: company.categoryId,
    categoryName: company.category?.nameEn ?? null,
    categoryNameAr: company.category?.nameAr ?? null,
  };
}

export function toReviewPublic(
  review: ReviewWithRelations,
  options?: { includeUnpublishedReply?: boolean },
): ReviewPublic {
  const reply = review.replies?.[0];
  const visibleReply =
    reply && (reply.status === ReviewReplyStatusEnum.APPROVED || options?.includeUnpublishedReply)
      ? reply
      : null;

  const serviceRatings: ReviewServiceRatingPublic[] | undefined = review.serviceRatings?.length
    ? review.serviceRatings.map((entry) => ({
        catalogItemId: entry.companyCatalogItemId,
        serviceName: entry.companyCatalogItem?.nameEn ?? 'Service',
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
    resolutionWindowDays: review.resolutionWindowDays,
    resolutionDeadlineAt: review.resolutionDeadlineAt?.toISOString() ?? null,
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
    ...(review.company && { company: toReviewCompanySummary(review.company) }),
    reply: visibleReply ? toReviewReplyPublic(visibleReply) : null,
  };
}

export function mapReviewsPublic(
  reviews: ReviewWithRelations[],
  options?: { includeUnpublishedReply?: boolean },
): ReviewPublic[] {
  return reviews.map((review) => toReviewPublic(review, options));
}

export function resolveReviewerContact(review: ReviewWithRelations): {
  name: string;
  email: string;
  phone: string | null;
} {
  const user = review.user;
  if (!user) {
    return { name: 'Reviewer', email: '', phone: null };
  }

  const phone =
    user.phoneVerified && user.phone
      ? user.phone
      : user.profile?.phone?.trim() || user.phone?.trim() || null;

  return {
    name: resolveAuthorDisplayName(user),
    email: user.email,
    phone,
  };
}

export function resolveCompanyOwnerEmail(review: ReviewWithRelations): string | null {
  return review.company?.owner?.email ?? review.company?.email ?? null;
}

import type { BlogPost, BlogPostTranslation } from '@prisma/client';
import type {
  BlogLocale,
  BlogPostAdmin,
  BlogPostPublic,
  BlogPostStatus,
  BlogPostTranslationPublic,
} from '@rateq/types';

type PostWithTranslations = BlogPost & { translations: BlogPostTranslation[] };

function toApiStatus(status: BlogPost['status']): BlogPostStatus {
  return status.toLowerCase() as BlogPostStatus;
}

function toPrismaStatus(status: BlogPostStatus): BlogPost['status'] {
  return status.toUpperCase() as BlogPost['status'];
}

export function toBlogTranslationPublic(
  translation: BlogPostTranslation,
): BlogPostTranslationPublic {
  return {
    locale: translation.locale as BlogLocale,
    title: translation.title,
    slug: translation.slug,
    excerpt: translation.excerpt,
    content: translation.content,
    metaTitle: translation.metaTitle,
    metaDescription: translation.metaDescription,
  };
}

export function toBlogPostPublic(
  post: PostWithTranslations,
  locale: BlogLocale,
): BlogPostPublic | null {
  const translation = post.translations.find((item) => item.locale === locale);

  if (!translation) {
    return null;
  }

  return {
    id: post.id,
    status: toApiStatus(post.status),
    coverUrl: post.coverUrl,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    translation: toBlogTranslationPublic(translation),
  };
}

export function toBlogPostAdmin(post: PostWithTranslations): BlogPostAdmin {
  return {
    id: post.id,
    status: toApiStatus(post.status),
    coverUrl: post.coverUrl,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    translations: post.translations.map(toBlogTranslationPublic),
  };
}

export { toPrismaStatus };

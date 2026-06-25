import { BlogCard } from '@/components/blog/blog-card';
import { SectionHeader } from '@/components/home/section-header';
import type { BlogPostPublic } from '@rateq/types';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface LatestBlogSectionProps {
  posts: BlogPostPublic[];
  locale: string;
}

export async function LatestBlogSection({
  posts,
  locale,
}: LatestBlogSectionProps): Promise<JSX.Element | null> {
  if (posts.length === 0) return null;

  const t = await getTranslations('blog');

  return (
    <section className="bg-white py-12 dark:bg-slate-900 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('homeSectionTitle')}
          actionLabel={t('viewAll')}
          actionHref="/blog"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <BlogCard key={post.id} post={post} locale={locale} readMoreLabel={t('readMore')} />
          ))}
        </div>
      </div>
    </section>
  );
}

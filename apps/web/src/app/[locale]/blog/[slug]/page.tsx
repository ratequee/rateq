import { BlogContent } from '@/components/blog/blog-content';
import { Link } from '@/i18n/routing';
import { fetchBlogPostBySlug } from '@/lib/blog-data';
import { scrollRevealProps } from '@/lib/scroll-reveal';
import { formatBlogDate } from '@/lib/format-blog-date';
import type { BlogLocale } from '@rateq/types';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as BlogLocale;
  const post = await fetchBlogPostBySlug(locale, slug);

  if (!post) {
    return {};
  }

  const { translation } = post;

  return {
    title: translation.metaTitle ?? translation.title,
    description: translation.metaDescription ?? translation.excerpt ?? undefined,
    openGraph: {
      title: translation.metaTitle ?? translation.title,
      description: translation.metaDescription ?? translation.excerpt ?? undefined,
      ...(post.coverUrl ? { images: [{ url: post.coverUrl }] } : {}),
    },
  };
}

export default async function BlogDetailPage({
  params,
}: BlogDetailPageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const locale = (await getLocale()) as BlogLocale;
  const t = await getTranslations('blog');
  const post = await fetchBlogPostBySlug(locale, slug);

  if (!post) {
    notFound();
  }

  const { translation } = post;

  return (
    <article className="bg-white dark:bg-dm-bg">
      <div
        {...scrollRevealProps('fade-in')}
        className="border-b border-slate-100 bg-slate-50/60 py-8 dark:border-dm-border dark:bg-dm-surface sm:py-10"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-white/85"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('backToBlog')}
          </Link>
          <time
            dateTime={post.publishedAt ?? post.createdAt}
            className="mt-6 block text-sm text-ink-light dark:text-white/75"
          >
            {formatBlogDate(post.publishedAt ?? post.createdAt, locale)}
          </time>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink dark:text-white sm:text-4xl">
            {translation.title}
          </h1>
          {translation.excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-ink-muted dark:text-white/90">
              {translation.excerpt}
            </p>
          ) : null}
        </div>
      </div>

      {post.coverUrl ? (
        <div
          {...scrollRevealProps('fade-up')}
          className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-dm-border dark:bg-dm-surface">
            <img
              src={post.coverUrl}
              alt={translation.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>
      ) : null}

      <div
        {...scrollRevealProps('fade-up', 100)}
        className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 dark:text-slate-300"
      >
        <BlogContent content={translation.content} />
      </div>
    </article>
  );
}

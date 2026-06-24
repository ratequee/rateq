import { BlogContent } from '@/components/blog/blog-content';
import { Link } from '@/i18n/routing';
import { fetchBlogPostBySlug } from '@/lib/blog-data';
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
    <article className="bg-white">
      <div className="border-b border-slate-100 bg-slate-50/60 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('backToBlog')}
          </Link>
          <time
            dateTime={post.publishedAt ?? post.createdAt}
            className="mt-6 block text-sm text-ink-light"
          >
            {formatBlogDate(post.publishedAt ?? post.createdAt, locale)}
          </time>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {translation.title}
          </h1>
          {translation.excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">{translation.excerpt}</p>
          ) : null}
        </div>
      </div>

      {post.coverUrl ? (
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
          <img
            src={post.coverUrl}
            alt={translation.title}
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <BlogContent content={translation.content} />
      </div>
    </article>
  );
}

import { BlogCard } from '@/components/blog/blog-card';
import { fetchBlogPosts } from '@/lib/blog-data';
import type { BlogLocale } from '@rateq/types';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function BlogPage(): Promise<JSX.Element> {
  const locale = (await getLocale()) as BlogLocale;
  const t = await getTranslations('blog');
  const tc = await getTranslations('common');
  const { data: posts } = await fetchBlogPosts(locale, 12, 1);

  return (
    <div className="bg-slate-50/60 dark:bg-dm-bg">
      <section className="border-b border-slate-100 bg-white py-12 dark:border-dm-border dark:bg-dm-surface sm:py-16">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-ink dark:text-white sm:text-4xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted dark:text-white/90">{t('pageSubtitle')}</p>
        </div>
      </section>

      <section className="py-12 dark:bg-dm-bg sm:py-16">
        <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-ink-muted dark:text-white/85">{tc('noResults')}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} readMoreLabel={t('readMore')} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

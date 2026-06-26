import { Link } from '@/i18n/routing';
import { formatBlogDate } from '@/lib/format-blog-date';
import { cn } from '@/lib/utils';
import type { BlogPostPublic } from '@rateq/types';
import Image from 'next/image';

interface BlogCardProps {
  post: BlogPostPublic;
  locale: string;
  readMoreLabel: string;
  className?: string;
}

export function BlogCard({ post, locale, readMoreLabel, className }: BlogCardProps) {
  const { translation } = post;

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-dm-border dark:bg-dm-elevated',
        className,
      )}
    >
      <Link href={`/blog/${translation.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {post.coverUrl ? (
            <img
              src={post.coverUrl}
              alt={translation.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-500/10 to-brand-700/10">
              <Image
                src="/images/building.svg"
                alt=""
                width={64}
                height={64}
                className="opacity-40"
              />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <time
          dateTime={post.publishedAt ?? post.createdAt}
          className="text-xs text-ink-light dark:text-white/75"
        >
          {formatBlogDate(post.publishedAt ?? post.createdAt, locale)}
        </time>
        <Link href={`/blog/${translation.slug}`}>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-ink transition-colors group-hover:text-brand-500 dark:text-white dark:group-hover:text-white/90">
            {translation.title}
          </h3>
        </Link>
        {translation.excerpt ? (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted dark:text-white/85">
            {translation.excerpt}
          </p>
        ) : null}
        <Link
          href={`/blog/${translation.slug}`}
          className="mt-4 text-sm font-medium text-brand-500 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-white/85"
        >
          {readMoreLabel}
        </Link>
      </div>
    </article>
  );
}

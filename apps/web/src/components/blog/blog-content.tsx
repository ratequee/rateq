'use client';

import DOMPurify from 'dompurify';
import { useMemo } from 'react';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function blogPlainTextLength(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function blogPlainTextLengthCount(html: string): number {
  return blogPlainTextLength(html).length;
}

export function isBlogHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function hasMeaningfulBlogContent(content: string, minLength = 10): boolean {
  if (isBlogHtml(content)) {
    return blogPlainTextLengthCount(content) >= minLength;
  }

  return content.trim().length >= minLength;
}

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  const sanitized = useMemo(() => {
    if (!isBlogHtml(content)) return null;
    return sanitizeBlogHtml(content);
  }, [content]);

  if (sanitized) {
    return (
      <div
        className="blog-content prose prose-slate max-w-none text-ink-muted prose-headings:text-ink prose-a:text-brand-500"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="prose prose-slate max-w-none text-ink-muted dark:prose-invert dark:text-slate-300">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4 whitespace-pre-wrap leading-relaxed last:mb-0">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

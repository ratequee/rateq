import { Link } from '@/i18n/routing';
import type { CategoryDefinition } from '@/lib/categories';
import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { JSX } from 'react';

interface CategoryBreadcrumbProps {
  category: CategoryDefinition;
  variant?: 'light' | 'dark';
}

export async function CategoryBreadcrumb({
  category,
  variant = 'light',
}: CategoryBreadcrumbProps): Promise<JSX.Element> {
  const t = await getTranslations('categoryPage');
  const tc = await getTranslations('categories');
  const isDark = variant === 'dark';

  return (
    <nav aria-label={t('breadcrumbAria')} className="mb-6">
      <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${isDark ? 'text-white/70' : 'text-ink text-bold'}`}>
        <li>
          <Link
            href="/"
            className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gold-500'}`}
          >
            {t('home')}
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        <li>
          <Link
            href="/categories"
            className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gold-500'}`}
          >
            {t('categories')}
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        <li
          className={`font-medium ${isDark ? 'text-gold-300' : 'text-gold-300'}`}
          aria-current="page"
        >
          {tc(`items.${category.id}.name`)}
        </li>
      </ol>
    </nav>
  );
}

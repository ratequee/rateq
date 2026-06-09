'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const LOCALES = [
  { code: 'en' as const, label: 'EN', Flag: UsFlag },
  { code: 'ar' as const, label: 'AR', Flag: QaFlag },
];

function UsFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="16" fill="#B22234" />
      <path
        d="M0 1.23h24M0 3.69h24M0 6.15h24M0 8.62h24M0 11.08h24M0 13.54h24"
        stroke="#fff"
        strokeWidth="1.23"
      />
      <rect width="9.6" height="8.62" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="1.6" cy="1.23" r="0.45" />
        <circle cx="3.2" cy="1.23" r="0.45" />
        <circle cx="4.8" cy="1.23" r="0.45" />
        <circle cx="6.4" cy="1.23" r="0.45" />
        <circle cx="8" cy="1.23" r="0.45" />
        <circle cx="2.4" cy="2.46" r="0.45" />
        <circle cx="4" cy="2.46" r="0.45" />
        <circle cx="5.6" cy="2.46" r="0.45" />
        <circle cx="7.2" cy="2.46" r="0.45" />
        <circle cx="1.6" cy="3.69" r="0.45" />
        <circle cx="3.2" cy="3.69" r="0.45" />
        <circle cx="4.8" cy="3.69" r="0.45" />
        <circle cx="6.4" cy="3.69" r="0.45" />
        <circle cx="8" cy="3.69" r="0.45" />
        <circle cx="2.4" cy="4.92" r="0.45" />
        <circle cx="4" cy="4.92" r="0.45" />
        <circle cx="5.6" cy="4.92" r="0.45" />
        <circle cx="7.2" cy="4.92" r="0.45" />
        <circle cx="1.6" cy="6.15" r="0.45" />
        <circle cx="3.2" cy="6.15" r="0.45" />
        <circle cx="4.8" cy="6.15" r="0.45" />
        <circle cx="6.4" cy="6.15" r="0.45" />
        <circle cx="8" cy="6.15" r="0.45" />
        <circle cx="2.4" cy="7.38" r="0.45" />
        <circle cx="4" cy="7.38" r="0.45" />
        <circle cx="5.6" cy="7.38" r="0.45" />
        <circle cx="7.2" cy="7.38" r="0.45" />
      </g>
    </svg>
  );
}

function QaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="16" fill="#8D1B3D" />
      <path
        d="M0 0h7.2v16H0V0zm1.8 8c0-1.8 1.2-3.3 2.8-3.8-.4 1-.6 2-.6 3.1 0 1.1.2 2.1.6 3.1-1.6-.5-2.8-2-2.8-3.4z"
        fill="#fff"
      />
    </svg>
  );
}

interface LocaleSwitcherProps {
  className?: string;
  variant?: 'header' | 'mobile';
}

export function LocaleSwitcher({ className, variant = 'header' }: LocaleSwitcherProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((item) => item.code === locale) ?? LOCALES[0]!;

  const switchTo = (next: 'en' | 'ar') => {
    setOpen(false);
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'mobile') {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {LOCALES.map(({ code, label, Flag }) => (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
              locale === code
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-slate-200 text-ink-muted hover:border-slate-300',
            )}
          >
            <Flag className="h-4 w-6 shrink-0 rounded-sm border border-black/10 object-cover" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('switchLanguage')}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-slate-100"
      >
        <current.Flag className="h-4 w-6 shrink-0 rounded-sm border border-black/10" />
        <span className="uppercase">{current.label}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-ink-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {LOCALES.map(({ code, label, Flag }) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                onClick={() => switchTo(code)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50',
                  locale === code ? 'font-semibold text-brand-600' : 'text-ink',
                )}
              >
                <Flag className="h-4 w-6 shrink-0 rounded-sm border border-black/10" />
                <span className="uppercase">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

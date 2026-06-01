import { Logo } from '@/components/brand/logo';
import { Link } from '@/i18n/routing';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { JSX } from 'react';

export async function SiteFooter(): Promise<JSX.Element> {
  const t = await getTranslations('footer');
  const tc = await getTranslations('common');
  const year = new Date().getFullYear();

  const companyLinks = [
    { href: '/about', label: t('about') },
    { href: '/search', label: t('pricing') },
    { href: '/search', label: t('services') },
    { href: '/search', label: t('team') },
    { href: '/search', label: t('privacy') },
  ];

  const supportLinks = [
    { href: '/search', label: t('support') },
    { href: '/search', label: t('locate') },
    { href: '/search', label: t('booking') },
    { href: '/contact', label: t('contact') },
    { href: '/search', label: t('faq') },
  ];

  const social = [
    { icon: "/images/fb.svg", label: 'Facebook', href: '#' },
    { icon: "/images/x.svg", label: 'X', href: '#' },
    { icon: "/images/utube.svg", label: 'Youtube', href: '#' },
    { icon: "/images/in.svg", label: 'LinkedIn', href: '#' },
  ];

  return (
    <footer className="bg-black text-white pt-[100px]">
      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white">{t('aboutText')}</p>
            <p className="mt-6 text-sm font-semibold text-white">{t('followUs')}</p>
            <ul className="mt-3 flex gap-2">
              {social.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-white transition-colors hover:bg-gold-300 hover:text-brand-800"
                  >
                    <Image src={Icon} alt={label} width={label === 'Facebook' ? 10 : 15} height={15} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase text-white">{t('ourAddress')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden />
                {t('address')}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold-300" aria-hidden />
                <a href="tel:+97400000000" className="hover:text-gold-300">
                  {t('phone')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-gold-300" aria-hidden />
                <a href="mailto:support@rateq.com" className="hover:text-gold-300">
                  {t('email')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-gold-300" aria-hidden />
                <a href="https://www.rateq.com" className="hover:text-gold-300">
                  www.rateq.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase text-white">{t('company')}</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white transition-colors hover:text-gold-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold uppercase text-white">{t('helpSupport')}</h3>
            <ul className="mt-4 space-y-2.5">
              {supportLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white transition-colors hover:text-gold-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm sm:flex-col-reverse">
            <p>
              © {year} {tc('appName')}. {t('rights')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/search" className="hover:text-gold-300">
                {t('privacy')}
              </Link>
              <Link href="/search" className="hover:text-gold-300">
                {t('terms')}
              </Link>
              <Link href="/search" className="hover:text-gold-300">
                {t('cookies')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

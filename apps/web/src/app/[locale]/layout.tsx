import { AuthProvider } from '@/components/providers/auth-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { avenirNextRounded } from '@/lib/fonts';
import { Noto_Sans_Arabic } from 'next/font/google';
import { Toaster } from 'sonner';
import '../globals.css';
import type { Metadata } from 'next';
import type { JSX } from 'react';

const notoArabic = Noto_Sans_Arabic({ subsets: ['arabic'], variable: '--font-noto-arabic' });

export const metadata: Metadata = {
  title: { default: 'RateQ', template: '%s | RateQ' },
  description: 'Bilingual review platform — trusted company ratings and reviews',
  openGraph: { type: 'website', siteName: 'RateQ' },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${avenirNextRounded.variable} ${notoArabic.variable} ${isRtl ? 'font-arabic' : 'font-sans'}`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <Toaster richColors position={isRtl ? 'top-left' : 'top-right'} />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

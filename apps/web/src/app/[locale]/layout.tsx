import { AuthProvider } from '@/components/providers/auth-provider';
import { ProfileProvider } from '@/components/providers/profile-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppShell } from '@/components/layout/app-shell';
import { SiteFooter } from '@/components/layout/site-footer';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { nunito } from '@/lib/fonts';
import { Noto_Sans_Arabic } from 'next/font/google';
import { Toaster } from 'sonner';
import '../globals.css';
import type { Metadata } from 'next';
import type { JSX } from 'react';

const notoArabic = Noto_Sans_Arabic({ subsets: ['arabic'], variable: '--font-noto-arabic' });

export const metadata: Metadata = {
  title: { default: 'RateQ', template: '%s | RateQ' },
  description: 'Bilingual review platform — trusted company ratings and reviews',
  icons: {
    icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
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
    <div
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen ${isRtl ? `${notoArabic.className} font-arabic` : `${nunito.className} font-sans`} ${notoArabic.variable}`}
    >
      <NextIntlClientProvider messages={messages}>
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
              <AppShell footer={<SiteFooter />}>{children}</AppShell>
              <Toaster richColors position={isRtl ? 'top-left' : 'top-right'} />
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}

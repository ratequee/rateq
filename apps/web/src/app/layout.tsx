import { nunito } from '@/lib/fonts';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RateQ — Coming Soon',
  description: "Qatar's trusted review platform is launching soon.",
  icons: {
    icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <body className={`${nunito.className} font-sans antialiased`}>{children}</body>
    </html>
  );
}

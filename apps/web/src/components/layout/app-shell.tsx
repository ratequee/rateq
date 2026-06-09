'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { usePathname } from '@/i18n/routing';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  footer: ReactNode;
}

function shouldHidePublicChrome(pathname: string): boolean {
  return pathname.includes('/dashboard');
}

export function AppShell({ children, footer }: AppShellProps) {
  const pathname = usePathname();
  const hideChrome = shouldHidePublicChrome(pathname);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}

import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};

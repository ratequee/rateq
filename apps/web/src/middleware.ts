import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  /*
   * Profile + dashboard route guards (disabled for UI testing).
   * Uncomment when backend profile completion checks are wired up.
   *
   * const { pathname } = request.nextUrl;
   * const locale = pathname.split('/')[1];
   * const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
   * const accessToken = request.cookies.get('rateq_access_token')?.value;
   *
   * const protectedRoutes = ['/dashboard', '/complete-profile'];
   * const isProtected = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
   *
   * if (isProtected && !accessToken) {
   *   return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
   * }
   *
   * if (pathWithoutLocale.startsWith('/complete-profile') && accessToken) {
   *   const profileComplete = request.cookies.get('rateq_profile_complete')?.value === 'true';
   *   if (profileComplete) {
   *     return NextResponse.redirect(new URL(`/${locale}/dashboard/reviewer`, request.url));
   *   }
   * }
   */

  return response;
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};

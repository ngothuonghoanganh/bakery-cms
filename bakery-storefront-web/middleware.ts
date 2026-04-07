import { NextRequest, NextResponse } from 'next/server';

const locales = ['vi', 'en'] as const;
const defaultLocale = 'vi';
const PUBLIC_FILE = /\.[^/]+$/;

const hasLocalePrefix = (pathname: string): boolean => {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
};

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (hasLocalePrefix(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

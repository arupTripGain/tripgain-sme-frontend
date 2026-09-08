import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');
  const authCookie = req.cookies.get('auth_session');

  if (!authCookie && !isLoginPage) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authCookie && isLoginPage) {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$|sitemap.xml|robots.txt).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';
import { resolvePage } from './common/utils/page-route';

export function proxy(request: NextRequest) {
  const language = resolvePage(
    request.nextUrl.pathname,
    request.headers.get('accept-language') ?? '',
  ).language;
  const headers = new Headers(request.headers);
  headers.set('x-app-language', language);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/|tool-icons/|favicon.svg|robots.txt|sitemap.xml|ads.txt|healthz).*)'],
};

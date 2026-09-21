import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { headers } from 'next/headers';
import { preferredLanguage } from '../common/utils/page-route';
import '../common/styles/global.css';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#ffffff' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const language = preferredLanguage(
    requestHeaders.get('x-app-language') ?? requestHeaders.get('accept-language') ?? '',
  );
  return (
    <html lang={language}>
      <body>{children}</body>
    </html>
  );
}

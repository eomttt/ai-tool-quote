import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { headers } from 'next/headers';
import { DM_Sans, Noto_Sans_KR } from 'next/font/google';
import { preferredLanguage } from '../common/utils/page-route';
import '../common/styles/global.css';

// Keep the first rendered font when a slow connection delays the web font.
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-dm-sans',
});
const notoSansKr = Noto_Sans_KR({
  preload: false,
  display: 'optional',
  variable: '--font-noto-sans-kr',
});

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#ffffff' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const language = preferredLanguage(
    requestHeaders.get('x-app-language') ?? requestHeaders.get('accept-language') ?? '',
  );
  return (
    <html lang={language} className={`${dmSans.variable} ${notoSansKr.variable}`}>
      <body>{children}</body>
    </html>
  );
}

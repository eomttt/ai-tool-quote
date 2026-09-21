import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { App } from '../../router/App';
import { createPageData, createPageMetadata } from '../../server/page-metadata';
import { siteConfigFromEnvironment } from '../../server/site-config';

type Props = { params: Promise<{ path?: string[] }> };

async function getPage(params: Props['params']) {
  const { path = [] } = await params;
  const requestHeaders = await headers();
  const config = siteConfigFromEnvironment();
  const page = createPageData(
    `/${path.join('/')}`,
    requestHeaders.get('accept-language') ?? '',
    config,
  );
  return { page, config };
}

export async function generateMetadata({ params }: Props) {
  const { page, config } = await getPage(params);
  return createPageMetadata(page, config);
}

export default async function Page({ params }: Props) {
  const { page, config } = await getPage(params);
  if (page.kind === 'not-found') notFound();
  return (
    <>
      <App key={page.language} page={page} />
      {page.adsEnabled && page.kind === 'catalog' ? (
        <Script
          id="adsense-auto"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClient}`}
          crossOrigin="anonymous"
        />
      ) : null}
    </>
  );
}

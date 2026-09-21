import { StrictMode } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { createAppI18n } from '../common/utils/create-i18n';
import { pagePath, resolvePage } from '../common/utils/page-route';
import type { PageData } from '../common/models/model-page';
import type { SiteConfig } from '../server/site-config';
import { App } from './App';

export { createSiteConfig } from '../server/site-config';

export function serializePageData(page: PageData) {
  return JSON.stringify(page)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

export function renderPage(
  pathname: string,
  acceptLanguage: string,
  config: SiteConfig,
  production = false,
) {
  const route = resolvePage(pathname, acceptLanguage);
  const page: PageData = {
    language: route.language,
    kind: route.kind,
    medium: route.medium,
    year: new Date().getUTCFullYear(),
    adsEnabled: production && config.adsenseEnabled,
    contactEmail: config.contactEmail,
  };
  const instance = createAppI18n(page.language);
  const t = instance.getFixedT(page.language, 'ui');
  const title =
    page.kind === 'catalog'
      ? t(`meta.${page.medium}.title`)
      : page.kind === 'not-found'
        ? t('notFound.title')
        : `${t(`${page.kind}.title`)} — ${t('brand')}`;
  const description =
    page.kind === 'catalog'
      ? t(`meta.${page.medium}.description`)
      : page.kind === 'about'
        ? t('about.description')
        : page.kind === 'privacy'
          ? t('privacy.description')
          : t('notFound.description');
  const canonicalPath = pagePath(page.language, page.kind, page.medium);
  const canonical = config.publicSiteUrl ? `${config.publicSiteUrl}${canonicalPath}` : undefined;
  const indexable = Boolean(production && config.publicSiteUrl && page.kind !== 'not-found');
  const head = renderToStaticMarkup(
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={indexable ? 'index,follow' : 'noindex,nofollow'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={t('brand')} />
      <meta property="og:locale" content={page.language === 'ko' ? 'ko_KR' : 'en_US'} />
      <meta name="twitter:card" content="summary" />
      {canonical && page.kind !== 'not-found' ? (
        <>
          <link rel="canonical" href={canonical} />
          <meta property="og:url" content={canonical} />
          <link
            rel="alternate"
            hrefLang="ko"
            href={`${config.publicSiteUrl}${pagePath('ko', page.kind, page.medium)}`}
          />
          <link
            rel="alternate"
            hrefLang="en"
            href={`${config.publicSiteUrl}${pagePath('en', page.kind, page.medium)}`}
          />
          <link
            rel="alternate"
            hrefLang="x-default"
            href={`${config.publicSiteUrl}${route.suffix}`}
          />
        </>
      ) : null}
      {production && config.adsenseClient && page.kind === 'catalog' ? (
        <meta name="google-adsense-account" content={config.adsenseClient} />
      ) : null}
      {page.adsEnabled && page.kind === 'catalog' ? (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClient}`}
          crossOrigin="anonymous"
        />
      ) : null}
    </>,
  );
  const html = renderToString(
    <StrictMode>
      <I18nextProvider i18n={instance}>
        <App page={page} />
      </I18nextProvider>
    </StrictMode>,
  );
  return {
    head,
    html,
    data: serializePageData(page),
    language: page.language,
    status: page.kind === 'not-found' ? 404 : 200,
  };
}

export function renderSitemap(config: SiteConfig) {
  if (!config.publicSiteUrl) return undefined;
  const paths = ['/', '/images', '/about', '/privacy'];
  const urls = ['ko', 'en'].flatMap((language) =>
    paths.map((path) => `<url><loc>${config.publicSiteUrl}/${language}${path}</loc></url>`),
  );
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
}

export function renderRobots(config: SiteConfig, production: boolean) {
  return production && config.publicSiteUrl
    ? `User-agent: *\nAllow: /\nSitemap: ${config.publicSiteUrl}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}

export function renderAdsTxt(config: SiteConfig) {
  return config.adsenseClient
    ? `google.com, ${config.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : undefined;
}

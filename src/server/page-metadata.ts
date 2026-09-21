import type { Metadata } from 'next';
import type { PageData } from '../common/models/model-page';
import { pagePath, resolvePage } from '../common/utils/page-route';
import ko from '../common/locales/ui.ko.json';
import en from '../common/locales/ui.en.json';
import type { SiteConfig } from './site-config';

export function createPageData(
  pathname: string,
  acceptLanguage: string,
  config: SiteConfig,
  production = process.env.NODE_ENV === 'production',
): PageData {
  const route = resolvePage(pathname, acceptLanguage);
  return {
    language: route.language,
    kind: route.kind,
    medium: route.medium,
    year: new Date().getUTCFullYear(),
    adsEnabled: production && config.adsenseEnabled,
    contactEmail: config.contactEmail,
  };
}

export function createPageMetadata(
  page: PageData,
  config: SiteConfig,
  production = process.env.NODE_ENV === 'production',
): Metadata {
  const messages = page.language === 'ko' ? ko : en;
  const title =
    page.kind === 'catalog'
      ? messages[`meta.${page.medium}.title`]
      : page.kind === 'not-found'
        ? messages['notFound.title']
        : `${messages[`${page.kind}.title`]} — ${messages.brand}`;
  const description =
    page.kind === 'catalog'
      ? messages[`meta.${page.medium}.description`]
      : page.kind === 'not-found'
        ? messages['notFound.description']
        : messages[`${page.kind}.description`];
  const publicSiteUrl = config.publicSiteUrl;
  const canonical =
    publicSiteUrl && page.kind !== 'not-found'
      ? `${publicSiteUrl}${pagePath(page.language, page.kind, page.medium)}`
      : undefined;
  const suffix =
    page.kind === 'catalog' ? (page.medium === 'image' ? '/images' : '/') : `/${page.kind}`;
  const indexable = Boolean(production && canonical);
  return {
    title,
    description,
    icons: { icon: '/favicon.svg' },
    robots: { index: indexable, follow: indexable },
    alternates: canonical
      ? {
          canonical,
          languages: {
            ko: `${publicSiteUrl}${pagePath('ko', page.kind, page.medium)}`,
            en: `${publicSiteUrl}${pagePath('en', page.kind, page.medium)}`,
            'x-default': `${publicSiteUrl}${suffix}`,
          },
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: messages.brand,
      locale: page.language === 'ko' ? 'ko_KR' : 'en_US',
      url: canonical,
    },
    twitter: { card: 'summary', title, description },
    other:
      production && config.adsenseClient && page.kind === 'catalog'
        ? { 'google-adsense-account': config.adsenseClient }
        : undefined,
  };
}

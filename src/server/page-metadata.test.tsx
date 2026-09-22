import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from '../router/App';
import { preferredLanguage } from '../common/utils/page-route';
import { createPageData, createPageMetadata } from './page-metadata';
import { createSiteConfig, siteConfigFromEnvironment } from './site-config';
import { renderAdsTxt, renderRobots, renderSitemap } from './site-resources';

const config = createSiteConfig({ publicSiteUrl: 'https://tools.example.com' });

describe('Next.js page data and metadata', () => {
  it('renders catalog HTML with the same language as its metadata', () => {
    const korean = createPageData('/', 'ko-KR,en;q=0.8', config, true);
    const english = createPageData('/en/images', 'ko-KR', config, true);
    const koreanHtml = renderToString(<App page={korean} />);
    const englishHtml = renderToString(<App page={english} />);
    expect(koreanHtml).toContain('Runway');
    expect(koreanHtml).toContain('28개 도구');
    expect(englishHtml).toContain('25 tools');
    expect(englishHtml).toContain('Photoroom');
    expect(createPageMetadata(korean, config, true).title).toContain('쇼츠 제작부터 게시까지');
    expect(createPageMetadata(english, config, true).alternates).toEqual({
      canonical: 'https://tools.example.com/en/images',
      languages: {
        ko: 'https://tools.example.com/ko/images',
        en: 'https://tools.example.com/en/images',
        'x-default': 'https://tools.example.com/images',
      },
    });
  });

  it('isolates translations and respects browser language priority', () => {
    expect(preferredLanguage('ko;q=0.1,en;q=0.9')).toBe('en');
    expect(preferredLanguage('en;q=0,ko-KR;q=0.7')).toBe('ko');
    expect(preferredLanguage('fr,ja;q=0.5')).toBe('en');
    const page = createPageData('/ko', '', config);
    const first = renderToString(<App page={page} />);
    renderToString(<App page={createPageData('/en', '', config)} />);
    expect(renderToString(<App page={page} />)).toBe(first);
  });

  it('keeps information pages and excludes missing pages from search', () => {
    expect(renderToString(<App page={createPageData('/ko/about', '', config)} />)).toContain(
      '정보를 확인하는 방법',
    );
    expect(renderToString(<App page={createPageData('/en/privacy', '', config)} />)).toContain(
      'Searches and selections',
    );
    const missing = createPageData('/does-not-exist', '', config, true);
    expect(missing.kind).toBe('not-found');
    expect(createPageMetadata(missing, config, true).robots).toEqual({
      index: false,
      follow: false,
    });
    expect(createPageMetadata(missing, config, true).alternates).toBeUndefined();
  });

  it('keeps publisher verification separate from ad activation', () => {
    const verification = createSiteConfig({
      publicSiteUrl: 'https://tools.example.com',
      adsenseClient: 'ca-pub-1234567890123456',
    });
    const page = createPageData('/ko', '', verification, true);
    expect(page.adsEnabled).toBe(false);
    expect(createPageMetadata(page, verification, true).other).toEqual({
      'google-adsense-account': 'ca-pub-1234567890123456',
    });
    expect(
      createPageMetadata(createPageData('/en/privacy', '', verification), verification, true).other,
    ).toBeUndefined();
    expect(
      createPageData('/', '', { ...verification, adsenseEnabled: true }, false).adsEnabled,
    ).toBe(false);
    expect(renderAdsTxt(verification)).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    );
    expect(renderAdsTxt(config)).toBeUndefined();
  });

  it('uses the production domain and disables ads and indexing in Vercel previews', () => {
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'tools.vercel.app',
      ADSENSE_CLIENT: 'ca-pub-1234567890123456',
      ADSENSE_ENABLED: 'true',
    };
    const production = siteConfigFromEnvironment(environment);
    expect(production.publicSiteUrl).toBe('https://tools.vercel.app');
    expect(production.adsenseEnabled).toBe(true);
    const preview = siteConfigFromEnvironment({
      ...environment,
      VERCEL_ENV: 'preview',
      PUBLIC_SITE_URL: 'https://tools.example.com',
    });
    expect(preview.publicSiteUrl).toBeUndefined();
    expect(preview.adsenseEnabled).toBe(false);
    expect(renderRobots(preview, true)).toContain('Disallow: /');
    expect(renderSitemap(preview)).toBeUndefined();
    expect(renderSitemap(config)?.match(/<loc>/g)).toHaveLength(8);
    expect(renderSitemap(config)).toContain('https://tools.example.com/ko</loc>');
    expect(renderRobots(config, true)).toContain('Allow: /');
  });

  it('rejects malformed public settings', () => {
    expect(() => createSiteConfig({ adsenseEnabled: true })).toThrow();
    expect(() => createSiteConfig({ publicSiteUrl: 'https://tools.example.com/path' })).toThrow();
    expect(() => createSiteConfig({ adsenseClient: '<script>' })).toThrow();
  });
});

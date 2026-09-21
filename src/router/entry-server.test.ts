import { describe, expect, it } from 'vitest';
import {
  createSiteConfig,
  renderPage,
  renderAdsTxt,
  renderRobots,
  renderSitemap,
  serializePageData,
} from './entry-server';
import { preferredLanguage } from '../common/utils/page-route';

const config = createSiteConfig({ publicSiteUrl: 'https://tools.example.com' });

describe('server-rendered pages', () => {
  it('returns real catalog HTML, localized metadata, and matching hydration language', () => {
    const korean = renderPage('/', 'ko-KR,en;q=0.8', config, true);
    const english = renderPage('/en/images', 'ko-KR', config, true);
    expect(korean.html).toContain('Runway');
    expect(korean.html).toContain('28개 도구');
    expect(korean.head).toContain('영상에 맞는 AI 도구');
    expect(korean.head).toContain('href="https://tools.example.com/ko/"');
    expect(korean.data).toContain('"language":"ko"');
    expect(english.html).toContain('25 tools');
    expect(english.html).toContain('Photoroom');
    expect(english.data).toContain('"language":"en"');
    expect(english.head).toContain('href="https://tools.example.com/en/images"');
    expect(english.head).toContain('hrefLang="ko"');
  });

  it('isolates languages across requests and respects Accept-Language quality', () => {
    expect(preferredLanguage('ko;q=0.1,en;q=0.9')).toBe('en');
    expect(preferredLanguage('en;q=0,ko-KR;q=0.7')).toBe('ko');
    expect(preferredLanguage('fr,ja;q=0.5')).toBe('en');
    const first = renderPage('/ko/', '', config);
    renderPage('/en/', '', config);
    const second = renderPage('/ko/', '', config);
    expect(first.html).toBe(second.html);
  });

  it('serves information pages and a real non-indexable 404', () => {
    expect(renderPage('/ko/about', '', config).html).toContain('정보를 확인하는 방법');
    expect(renderPage('/en/privacy', '', config).html).toContain('Searches and selections');
    const missing = renderPage('/does-not-exist', '', config, true);
    expect(missing.status).toBe(404);
    expect(missing.head).toContain('noindex,nofollow');
  });

  it('omits ad requests by default and publishes verification separately from ad activation', () => {
    expect(renderPage('/', '', config, true).head).not.toContain('adsbygoogle');
    const verification = createSiteConfig({
      publicSiteUrl: 'https://tools.example.com',
      adsenseClient: 'ca-pub-1234567890123456',
    });
    expect(renderPage('/', '', verification, true).head).toContain('google-adsense-account');
    expect(renderPage('/', '', verification, true).head).not.toContain('adsbygoogle');
    const active = { ...verification, adsenseEnabled: true };
    expect(renderPage('/', '', active, true).head).toContain(
      'adsbygoogle.js?client=ca-pub-1234567890123456',
    );
    expect(renderPage('/', '', active, false).head).not.toContain('adsbygoogle');
    expect(renderPage('/en/privacy', '', active, true).head).not.toContain('adsbygoogle');
    expect(renderAdsTxt(verification)).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    );
    expect(renderAdsTxt(config)).toBeUndefined();
  });

  it('publishes canonical sitemap URLs and keeps previews out of search', () => {
    expect(renderSitemap(config)?.match(/<loc>/g)).toHaveLength(8);
    expect(renderSitemap(config)).toContain('https://tools.example.com/ko/images');
    expect(renderRobots(config, true)).toContain('Allow: /');
    expect(renderRobots(config, false)).toContain('Disallow: /');
    expect(renderPage('/', '', createSiteConfig({}), true).head).toContain('noindex,nofollow');
  });

  it('rejects malformed public settings and escapes hydration data', () => {
    expect(() => createSiteConfig({ adsenseEnabled: true })).toThrow();
    expect(() => createSiteConfig({ publicSiteUrl: 'https://tools.example.com/path' })).toThrow();
    expect(() => createSiteConfig({ adsenseClient: '<script>' })).toThrow();
    const serialized = serializePageData({
      language: 'en',
      kind: 'catalog',
      medium: 'video',
      year: 2026,
      adsEnabled: false,
      contactEmail: '</script><script>alert(1)</script>',
    });
    expect(serialized).not.toContain('</script>');
  });
});

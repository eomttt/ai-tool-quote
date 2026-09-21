import type { SiteConfig } from './site-config';

export function renderSitemap(config: SiteConfig) {
  if (!config.publicSiteUrl) return undefined;
  const paths = ['', '/images', '/about', '/privacy'];
  const urls = ['ko', 'en'].flatMap((language) =>
    paths.map((path) => `<url><loc>${config.publicSiteUrl}/${language}${path}</loc></url>`),
  );
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
}

export function renderRobots(
  config: SiteConfig,
  production = process.env.NODE_ENV === 'production',
) {
  return production && config.publicSiteUrl
    ? `User-agent: *\nAllow: /\nSitemap: ${config.publicSiteUrl}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}

export function renderAdsTxt(config: SiteConfig) {
  return config.adsenseClient
    ? `google.com, ${config.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : undefined;
}

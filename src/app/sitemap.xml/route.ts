import { siteConfigFromEnvironment } from '../../server/site-config';
import { renderSitemap } from '../../server/site-resources';

export const dynamic = 'force-dynamic';

export function GET() {
  const sitemap = renderSitemap(siteConfigFromEnvironment());
  return new Response(sitemap ?? '', {
    status: sitemap ? 200 : 404,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

import { siteConfigFromEnvironment } from '../../server/site-config';
import { renderAdsTxt } from '../../server/site-resources';

export const dynamic = 'force-dynamic';

export function GET() {
  const ads = renderAdsTxt(siteConfigFromEnvironment());
  return new Response(ads ?? '', {
    status: ads ? 200 : 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

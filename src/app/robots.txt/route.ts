import { siteConfigFromEnvironment } from '../../server/site-config';
import { renderRobots } from '../../server/site-resources';

export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(renderRobots(siteConfigFromEnvironment()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

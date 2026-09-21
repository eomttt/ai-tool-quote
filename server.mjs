// @ts-check
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import express from 'express';
import compression from 'compression';

const production = process.env.NODE_ENV === 'production';
const root = fileURLToPath(new URL('.', import.meta.url));
const app = express();
const server = createServer(app);
const host = process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
const port = Number(process.env.PORT ?? (production ? '4173' : '5173'));
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT.');

app.disable('x-powered-by');
app.use(compression());
app.use((_request, response, next) => {
  response.set('X-Content-Type-Options', 'nosniff');
  response.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.get('/index.html', (_request, response) => response.redirect(308, '/'));
app.get('/healthz', (_request, response) => response.type('text').send('ok'));

const vite = production
  ? undefined
  : await (
      await import('vite')
    ).createServer({
      root,
      appType: 'custom',
      server: { middlewareMode: true, hmr: { server } },
    });

if (vite) app.use(vite.middlewares);
else {
  app.use(
    '/assets',
    express.static(`${root}/dist/client/assets`, { immutable: true, maxAge: '1y' }),
  );
  app.use(express.static(`${root}/dist/client`, { index: false, maxAge: '1h' }));
}

const template = production
  ? await fs.readFile(`${root}/dist/client/index.html`, 'utf8')
  : undefined;
/** @returns {Promise<typeof import('./src/router/entry-server')>} */
async function loadRenderer() {
  const entry = new URL('./dist/server/entry-server.js', import.meta.url).href;
  /** @type {unknown} */
  const renderer = vite
    ? await vite.ssrLoadModule('/src/router/entry-server.tsx')
    : await import(entry);
  if (!isRenderer(renderer)) throw new Error('Invalid SSR renderer exports.');
  return renderer;
}
/** @param {unknown} value @returns {value is typeof import('./src/router/entry-server')} */
function isRenderer(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'createSiteConfig' in value &&
    typeof value.createSiteConfig === 'function' &&
    'renderPage' in value &&
    typeof value.renderPage === 'function' &&
    'serializePageData' in value &&
    typeof value.serializePageData === 'function' &&
    'renderRobots' in value &&
    typeof value.renderRobots === 'function' &&
    'renderAdsTxt' in value &&
    typeof value.renderAdsTxt === 'function' &&
    'renderSitemap' in value &&
    typeof value.renderSitemap === 'function'
  );
}
const initialRenderer = await loadRenderer();
const config = initialRenderer.createSiteConfig({
  publicSiteUrl: process.env.PUBLIC_SITE_URL,
  adsenseClient: process.env.ADSENSE_CLIENT,
  adsenseEnabled: process.env.ADSENSE_ENABLED === 'true',
  contactEmail: process.env.CONTACT_EMAIL,
});

app.use(async (request, response, next) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.set('Allow', 'GET, HEAD').status(405).end();
      return;
    }
    const renderer = await loadRenderer();
    if (request.path === '/robots.txt') {
      response.type('text').send(renderer.renderRobots(config, production));
      return;
    }
    if (request.path === '/sitemap.xml') {
      const sitemap = renderer.renderSitemap(config);
      response
        .status(sitemap ? 200 : 404)
        .type('application/xml')
        .send(sitemap ?? '');
      return;
    }
    if (request.path === '/ads.txt') {
      const ads = renderer.renderAdsTxt(config);
      response
        .status(ads ? 200 : 404)
        .type('text')
        .send(ads ?? '');
      return;
    }
    const source = template ?? (await fs.readFile(`${root}/index.html`, 'utf8'));
    const transformed = vite ? await vite.transformIndexHtml(request.originalUrl, source) : source;
    const rendered = renderer.renderPage(
      request.path,
      request.get('Accept-Language') ?? '',
      config,
      production,
    );
    const html = transformed
      .replace('<html lang="en">', `<html lang="${rendered.language}">`)
      .replace('<!--app-head-->', () => rendered.head)
      .replace('<!--app-html-->', () => rendered.html)
      .replace(
        '<!--app-data-->',
        () => `<script id="page-data" type="application/json">${rendered.data}</script>`,
      );
    response
      .vary('Accept-Language')
      .set('Cache-Control', 'no-cache')
      .status(rendered.status)
      .type('html')
      .send(html);
  } catch (error) {
    if (vite && error instanceof Error) vite.ssrFixStacktrace(error);
    next(error);
  }
});

/** @type {import('express').ErrorRequestHandler} */
const handleError = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).type('text').send('Unable to load this page. Please try again.');
};
app.use(handleError);
server.listen(port, host, () => {
  const address = server.address();
  if (address && typeof address !== 'string')
    console.log(`SSR server listening at http://${host}:${address.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      if (vite) void vite.close().finally(() => process.exit(0));
      else process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  });

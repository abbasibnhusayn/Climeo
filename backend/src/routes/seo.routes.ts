// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { CITY_SEEDS, findCityBySlug } from '../seo/citySeed.js';
import { renderCityWeatherPage } from '../seo/seoPage.service.js';
import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';
import { cacheGet, cacheSet } from '../cache/redisCache.js';

const weatherProvider = new OpenMeteoProvider();
const SEO_PAGE_CACHE_TTL_SECONDS = 1800;

// The sitemap protocol caps each file at 50,000 URLs / 50MB uncompressed.
// We chunk conservatively below that ceiling so this keeps working
// unchanged whether CITY_SEEDS has 280 entries (the curated tier) or
// several hundred thousand (after `npm run import-cities`).
const URLS_PER_SITEMAP = 40_000;
const SITE_ORIGIN = process.env.PUBLIC_SITE_ORIGIN ?? 'https://climeo.app';

function sitemapChunkCount(): number {
  return Math.max(1, Math.ceil(CITY_SEEDS.length / URLS_PER_SITEMAP));
}

function renderUrlset(cities: typeof CITY_SEEDS): string {
  const urls = cities
    .map((city) => `  <url><loc>${SITE_ORIGIN}/weather/${city.slug}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function renderSitemapIndex(chunkCount: number): string {
  const entries = Array.from({ length: chunkCount }, (_, i) =>
    `  <sitemap><loc>${SITE_ORIGIN}/sitemap-${i + 1}.xml</loc></sitemap>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

export async function seoRoutes(app: FastifyInstance) {
  app.get('/weather/:citySlug', async (request, reply) => {
    const { citySlug } = request.params as { citySlug: string };
    const city = findCityBySlug(citySlug);

    if (!city) {
      return reply.status(404).send('City not found');
    }

    const cacheKey = `seo-page:${citySlug}`;
    const cached = await cacheGet<string>(cacheKey);
    if (cached) {
      return reply.type('text/html').send(cached);
    }

    try {
      const forecast = await weatherProvider.getForecast(
        { latitude: city.latitude, longitude: city.longitude },
        7,
      );
      const html = renderCityWeatherPage(city, forecast);
      await cacheSet(cacheKey, html, SEO_PAGE_CACHE_TTL_SECONDS);
      return reply.type('text/html').send(html);
    } catch (err) {
      request.log.error(err, 'SEO page render failed');
      return reply.status(502).send('Weather data temporarily unavailable');
    }
  });

  // Below the per-file URL limit: serve a single flat sitemap, which is
  // simpler for small datasets (the curated ~280-city tier) and for
  // anyone testing locally. Once the GeoNames import pushes CITY_SEEDS
  // past the threshold, this automatically becomes a sitemap index
  // instead — no config flag, it's derived from the actual dataset size.
  app.get('/sitemap.xml', async (request, reply) => {
    const chunkCount = sitemapChunkCount();

    if (chunkCount === 1) {
      return reply.type('application/xml').send(renderUrlset(CITY_SEEDS));
    }

    return reply.type('application/xml').send(renderSitemapIndex(chunkCount));
  });

  app.get('/sitemap-:page.xml', async (request, reply) => {
    const { page } = request.params as { page: string };
    const pageNum = Number(page);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return reply.status(404).send('Not found');
    }

    const start = (pageNum - 1) * URLS_PER_SITEMAP;
    const chunk = CITY_SEEDS.slice(start, start + URLS_PER_SITEMAP);

    if (chunk.length === 0) {
      return reply.status(404).send('Not found');
    }

    return reply.type('application/xml').send(renderUrlset(chunk));
  });

  app.get('/robots.txt', async (request, reply) => {
    return reply
      .type('text/plain')
      .send(`User-agent: *\nAllow: /weather/\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
  });
}

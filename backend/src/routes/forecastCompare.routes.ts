import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';
import { MetNoProvider } from '../providers/metNo.provider.js';
import { compareForecasts } from '../forecast/comparison.service.js';
import { cacheGet, cacheSet } from '../cache/redisCache.js';

const compareQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  // Capped at 5: met.no's sunrise endpoint is called once per day here,
  // so this keeps the request count (and latency) reasonable.
  days: z.coerce.number().int().min(1).max(5).default(3),
});

const providers = [new OpenMeteoProvider(), new MetNoProvider()];
const COMPARE_CACHE_TTL_SECONDS = 900;

export async function forecastCompareRoutes(app: FastifyInstance) {
  app.get('/v1/weather/forecast/compare', async (request, reply) => {
    const parsed = compareQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { lat, lon, days } = parsed.data;
    const cacheKey = `compare:${lat.toFixed(3)}:${lon.toFixed(3)}:${days}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return reply.header('x-climeo-cache', 'hit').send(cached);
    }

    const settled = await Promise.allSettled(
      providers.map((p) => p.getForecast({ latitude: lat, longitude: lon }, days)),
    );

    const succeeded = settled
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof providers[0]['getForecast']>>> =>
        r.status === 'fulfilled',
      )
      .map((r) => r.value);

    const failures = settled
      .map((r, i) => ({ provider: providers[i].name, result: r }))
      .filter((x) => x.result.status === 'rejected')
      .map((x) => ({
        provider: x.provider,
        error: (x.result as PromiseRejectedResult).reason?.message ?? 'unknown error',
      }));

    if (succeeded.length === 0) {
      request.log.error({ failures }, 'all weather providers failed');
      return reply.status(502).send({ error: 'all_providers_failed', failures });
    }

    const comparison = compareForecasts(succeeded);
    const response = { ...comparison, providerFailures: failures };

    await cacheSet(cacheKey, response, COMPARE_CACHE_TTL_SECONDS);
    return reply.header('x-climeo-cache', 'miss').send(response);
  });
}

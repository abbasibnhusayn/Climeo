import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';
import { cacheGet, cacheSet, FORECAST_CACHE_TTL_SECONDS } from '../cache/redisCache.js';
import type { WeatherProvider } from '../types/weather.types.js';

const forecastQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().int().min(1).max(16).default(7),
});

// Provider is resolved through the WeatherProvider interface only — swapping
// or adding providers (Phase 5) means adding a case here, not touching
// route or caching logic.
const providers: Record<string, WeatherProvider> = {
  'open-meteo': new OpenMeteoProvider(),
};

const DEFAULT_PROVIDER = 'open-meteo';

export async function weatherRoutes(app: FastifyInstance) {
  app.get('/v1/weather/forecast', async (request, reply) => {
    const parsed = forecastQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { lat, lon, days } = parsed.data;
    const provider = providers[DEFAULT_PROVIDER];
    const cacheKey = `forecast:${provider.name}:${lat.toFixed(3)}:${lon.toFixed(3)}:${days}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return reply.header('x-climeo-cache', 'hit').send(cached);
    }

    try {
      const forecast = await provider.getForecast({ latitude: lat, longitude: lon }, days);
      await cacheSet(cacheKey, forecast, FORECAST_CACHE_TTL_SECONDS);
      return reply.header('x-climeo-cache', 'miss').send(forecast);
    } catch (err) {
      request.log.error(err, 'forecast fetch failed');
      return reply.status(502).send({
        error: 'upstream_provider_error',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });

  app.get('/v1/weather/current', async (request, reply) => {
    const parsed = forecastQuerySchema.pick({ lat: true, lon: true }).safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { lat, lon } = parsed.data;
    const provider = providers[DEFAULT_PROVIDER];
    const cacheKey = `current:${provider.name}:${lat.toFixed(3)}:${lon.toFixed(3)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return reply.header('x-climeo-cache', 'hit').send(cached);
    }

    try {
      // Current conditions come off the same forecast payload — no need
      // for a second upstream call.
      const forecast = await provider.getForecast({ latitude: lat, longitude: lon }, 1);
      await cacheSet(cacheKey, forecast.current, FORECAST_CACHE_TTL_SECONDS);
      return reply.header('x-climeo-cache', 'miss').send(forecast.current);
    } catch (err) {
      request.log.error(err, 'current conditions fetch failed');
      return reply.status(502).send({
        error: 'upstream_provider_error',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });
}

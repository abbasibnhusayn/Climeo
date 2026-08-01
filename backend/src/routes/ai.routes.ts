import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';
import { getAiProvider } from '../ai/aiProviderFactory.js';
import { DailyBriefService } from '../ai/dailyBrief.service.js';
import { cacheGet, cacheSet } from '../cache/redisCache.js';

const briefQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const weatherProvider = new OpenMeteoProvider();

// Briefs are cached longer than raw forecast data — the underlying
// numbers rarely change enough within an hour to change the narrative,
// and AI calls cost real money, so we cache aggressively.
const BRIEF_CACHE_TTL_SECONDS = 1800;

export async function aiRoutes(app: FastifyInstance) {
  app.get('/v1/ai/daily-brief', async (request, reply) => {
    const parsed = briefQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { lat, lon } = parsed.data;
    const cacheKey = `brief:${lat.toFixed(3)}:${lon.toFixed(3)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return reply.header('x-climeo-cache', 'hit').send(cached);
    }

    try {
      const forecast = await weatherProvider.getForecast(
        { latitude: lat, longitude: lon },
        7,
      );

      const aiProvider = getAiProvider();
      const briefService = new DailyBriefService(aiProvider);
      const result = await briefService.generate(forecast);

      await cacheSet(cacheKey, result, BRIEF_CACHE_TTL_SECONDS);
      return reply.header('x-climeo-cache', 'miss').send(result);
    } catch (err) {
      request.log.error(err, 'daily brief generation failed');
      return reply.status(502).send({
        error: 'brief_generation_failed',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });
}

// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { featuresForTier, type SubscriptionTier } from './entitlements.js';
import { getSubscriptionTier } from '../auth/user.repository.js';
import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';

const weatherProvider = new OpenMeteoProvider();

const adContextQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

function temperatureBucket(tempC: number): 'cold' | 'mild' | 'hot' {
  if (tempC < 10) return 'cold';
  if (tempC > 30) return 'hot';
  return 'mild';
}

export async function monetizationRoutes(app: FastifyInstance) {
  app.get(
    '/v1/monetization/entitlements',
    { preHandler: app.requireAuth },
    async (request, reply) => {
      const tier = ((await getSubscriptionTier(request.user!.userId)) ?? 'free') as SubscriptionTier;
      return reply.send({ tier, features: featuresForTier(tier) });
    },
  );

  /**
   * Returns weather-derived targeting SIGNALS ONLY (condition category,
   * temperature bucket, day/night) — not ad creative or ad-network calls.
   * Actual ad rendering is a client-side SDK concern (AdMob/etc.);
   * this endpoint just gives real, current context to target with, e.g.
   * showing umbrella affiliate content when `precipitationExpected` is
   * true, never inventing conditions that aren't actually forecast.
   */
  app.get('/v1/monetization/ad-context', async (request, reply) => {
    const parsed = adContextQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { lat, lon } = parsed.data;

    try {
      const forecast = await weatherProvider.getForecast({ latitude: lat, longitude: lon }, 1);
      const today = forecast.daily[0];

      return reply.send({
        condition: forecast.current.condition,
        isDay: forecast.current.isDay,
        temperatureBucket: temperatureBucket(forecast.current.temperatureC),
        precipitationExpected: (today?.precipitationProbabilityPct ?? 0) >= 40,
        suggestedCategories: buildSuggestedCategories(forecast.current.condition, forecast.current.temperatureC),
      });
    } catch (err) {
      request.log.error(err, 'ad context lookup failed');
      return reply.status(502).send({ error: 'ad_context_unavailable' });
    }
  });
}

function buildSuggestedCategories(condition: string, tempC: number): string[] {
  const categories: string[] = [];
  if (condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm') {
    categories.push('rain_gear', 'ride_share');
  }
  if (condition === 'snow') categories.push('winter_gear');
  if (condition === 'clear' && tempC > 25) categories.push('sun_protection', 'outdoor_activities');
  if (tempC < 5) categories.push('cold_weather_gear', 'heating');
  if (categories.length === 0) categories.push('general');
  return categories;
}

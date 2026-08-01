// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';
import { OpenMeteoAirQualityProvider } from '../airquality/openMeteoAirQuality.provider.js';
import { computeRiskAssessments } from '../risk/riskEngine.service.js';
import { personalizeRiskAssessments } from '../risk/personalizeRisk.js';
import { getProfile } from '../personalization/profile.repository.js';
import { verifyToken } from '../auth/jwt.js';
import { cacheGet, cacheSet } from '../cache/redisCache.js';

const riskQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const weatherProvider = new OpenMeteoProvider();
const airQualityProvider = new OpenMeteoAirQualityProvider();
const RISK_CACHE_TTL_SECONDS = 600;

export async function riskRoutes(app: FastifyInstance) {
  app.get('/v1/weather/risk', async (request, reply) => {
    const parsed = riskQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_query',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { lat, lon } = parsed.data;

    // Auth is OPTIONAL here — risk data is useful to anonymous users too.
    // If a valid token is present, we personalize; if not, we still serve
    // the base assessment rather than requiring login.
    let userId: string | null = null;
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        userId = verifyToken(authHeader.slice('Bearer '.length)).userId;
      } catch {
        // Invalid/expired token on an optional-auth route — proceed
        // unpersonalized rather than rejecting the request.
      }
    }

    const cacheKey = `risk:${lat.toFixed(3)}:${lon.toFixed(3)}`;
    const cachedBase = await cacheGet<ReturnType<typeof computeRiskAssessments>>(cacheKey);

    try {
      const baseAssessments =
        cachedBase ??
        (await (async () => {
          const [forecast, airQuality] = await Promise.all([
            weatherProvider.getForecast({ latitude: lat, longitude: lon }, 1),
            airQualityProvider.getCurrent({ latitude: lat, longitude: lon }),
          ]);

          const assessments = computeRiskAssessments({
            temperatureC: forecast.current.temperatureC,
            humidityPct: forecast.current.humidityPct,
            condition: forecast.current.condition,
            windSpeedKph: forecast.current.windSpeedKph,
            uvIndex: forecast.current.uvIndex,
            airQuality,
          });

          await cacheSet(cacheKey, assessments, RISK_CACHE_TTL_SECONDS);
          return assessments;
        })());

      const profile = userId ? await getProfile(userId) : null;
      const personalized = personalizeRiskAssessments(baseAssessments, profile);

      return reply.send({
        location: { latitude: lat, longitude: lon },
        generatedAt: new Date().toISOString(),
        personalized: profile !== null,
        risks: personalized,
      });
    } catch (err) {
      request.log.error(err, 'risk assessment failed');
      return reply.status(502).send({
        error: 'risk_assessment_failed',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });
}

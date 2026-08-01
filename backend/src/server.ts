// Climeo — developed by Halool.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { weatherRoutes } from './routes/weather.routes.js';
import { forecastCompareRoutes } from './routes/forecastCompare.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { authPlugin } from './auth/authPlugin.js';
import { authRoutes } from './auth/auth.routes.js';
import { locationsRoutes } from './locations/locations.routes.js';
import { mapsRoutes } from './routes/maps.routes.js';
import { riskRoutes } from './routes/risk.routes.js';
import { profileRoutes } from './personalization/profile.routes.js';
import { seoRoutes } from './routes/seo.routes.js';
import { analyticsRoutes } from './analytics/analytics.routes.js';
import { monetizationRoutes } from './monetization/monetization.routes.js';
import { notificationRoutes } from './notifications/notification.routes.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

async function buildServer() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.get('/healthz', async () => ({
    status: 'ok',
    service: 'climeo-backend',
    developedBy: 'Halool',
  }));

  await app.register(authPlugin);
  await app.register(weatherRoutes);
  await app.register(forecastCompareRoutes);
  await app.register(aiRoutes);
  await app.register(authRoutes);
  await app.register(locationsRoutes);
  await app.register(mapsRoutes);
  await app.register(riskRoutes);
  await app.register(profileRoutes);
  await app.register(seoRoutes);
  await app.register(analyticsRoutes);
  await app.register(monetizationRoutes);
  await app.register(notificationRoutes);

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

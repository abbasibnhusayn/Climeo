// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyToken } from '../auth/jwt.js';
import { registerToken, removeToken } from './deviceToken.repository.js';
import { runAlertCheck } from './severeWeatherAlert.job.js';

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['android', 'ios', 'macos', 'windows', 'web']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const removeSchema = z.object({ token: z.string().min(1) });

export async function notificationRoutes(app: FastifyInstance) {
  // Auth is optional: logged-out users can still receive location-based
  // severe weather alerts for wherever their device last reported.
  app.post('/v1/notifications/register-token', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_body',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    let userId: string | null = null;
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        userId = verifyToken(header.slice('Bearer '.length)).userId;
      } catch {
        // Invalid token — register anonymously rather than reject.
      }
    }

    await registerToken({
      userId,
      token: parsed.data.token,
      platform: parsed.data.platform,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    });

    return reply.status(204).send();
  });

  app.delete('/v1/notifications/register-token', async (request, reply) => {
    const parsed = removeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_body',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await removeToken(parsed.data.token);
    return reply.status(204).send();
  });

  /**
   * Meant to be invoked by an external scheduler (platform cron, GitHub
   * Actions on a schedule, etc.) — see DEPLOYMENT.md §10. Not meant for
   * end users, so it's gated by a shared secret rather than user auth.
   */
  app.post('/v1/notifications/run-alert-check', async (request, reply) => {
    const secret = process.env.ALERT_CHECK_SECRET;
    if (!secret) {
      return reply.status(503).send({
        error: 'not_configured',
        message: 'ALERT_CHECK_SECRET is not set on the server',
      });
    }

    if (request.headers['x-alert-check-secret'] !== secret) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    try {
      const summary = await runAlertCheck();
      return reply.send(summary);
    } catch (err) {
      request.log.error(err, 'alert check run failed');
      return reply.status(500).send({
        error: 'alert_check_failed',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });
}

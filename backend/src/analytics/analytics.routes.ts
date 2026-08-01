// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyToken } from '../auth/jwt.js';
import { recordEvent } from './analyticsEvent.repository.js';

const eventSchema = z.object({
  eventName: z.string().min(1).max(100),
  properties: z.record(z.unknown()).default({}),
});

export async function analyticsRoutes(app: FastifyInstance) {
  app.post('/v1/analytics/event', async (request, reply) => {
    const parsed = eventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_body',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Auth is optional here — anonymous (pre-login) usage is still
    // valuable to track, so a missing/invalid token just means
    // userId is null rather than a 401.
    let userId: string | null = null;
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        userId = verifyToken(header.slice('Bearer '.length)).userId;
      } catch {
        // Invalid token on a best-effort analytics call — treat as anonymous.
      }
    }

    try {
      await recordEvent({
        userId,
        eventName: parsed.data.eventName,
        properties: parsed.data.properties,
      });
      return reply.status(202).send({ status: 'recorded' });
    } catch (err) {
      request.log.error(err, 'failed to record analytics event');
      // Analytics failures should never surface as a hard error to the
      // client — the event just didn't land this time.
      return reply.status(202).send({ status: 'dropped' });
    }
  });
}

// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getProfile, upsertProfile } from './profile.repository.js';

const profileSchema = z.object({
  ageGroup: z.enum(['child', 'adult', 'senior']).nullable().optional(),
  hasRespiratoryCondition: z.boolean().optional(),
  hasCardiovascularCondition: z.boolean().optional(),
  outdoorActivityLevel: z.enum(['low', 'moderate', 'high']).nullable().optional(),
});

export async function profileRoutes(app: FastifyInstance) {
  app.get('/v1/profile', { preHandler: app.requireAuth }, async (request, reply) => {
    const profile = await getProfile(request.user!.userId);
    return reply.send({ profile });
  });

  app.put('/v1/profile', { preHandler: app.requireAuth }, async (request, reply) => {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_body',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const profile = await upsertProfile(request.user!.userId, parsed.data);
    return reply.send({ profile });
  });
}

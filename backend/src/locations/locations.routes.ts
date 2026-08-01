import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createLocation, deleteLocation, listLocations } from './locations.repository.js';

const createLocationSchema = z.object({
  label: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isPrimary: z.boolean().optional(),
});

export async function locationsRoutes(app: FastifyInstance) {
  app.get(
    '/v1/locations',
    { preHandler: app.requireAuth },
    async (request, reply) => {
      const locations = await listLocations(request.user!.userId);
      return reply.send({ locations });
    },
  );

  app.post(
    '/v1/locations',
    { preHandler: app.requireAuth },
    async (request, reply) => {
      const parsed = createLocationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'invalid_body',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const location = await createLocation(request.user!.userId, parsed.data);
      return reply.status(201).send({ location });
    },
  );

  app.delete(
    '/v1/locations/:id',
    { preHandler: app.requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await deleteLocation(request.user!.userId, id);

      if (!deleted) {
        return reply.status(404).send({ error: 'not_found', message: 'Location not found' });
      }
      return reply.status(204).send();
    },
  );
}

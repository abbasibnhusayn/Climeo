// Climeo — developed by Halool.

import type { FastifyInstance } from 'fastify';
import { getRadarFrames } from '../maps/rainviewer.service.js';

export async function mapsRoutes(app: FastifyInstance) {
  app.get('/v1/maps/radar/frames', async (request, reply) => {
    try {
      const frames = await getRadarFrames();
      return reply.send(frames);
    } catch (err) {
      request.log.error(err, 'failed to fetch radar frames');
      return reply.status(502).send({
        error: 'radar_frames_unavailable',
        message: err instanceof Error ? err.message : 'unknown error',
      });
    }
  });
}

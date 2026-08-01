import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken, type ClimeoJwtPayload } from './jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: ClimeoJwtPayload;
  }
}

/**
 * Registers a `requireAuth` preHandler that routes can opt into. Kept as
 * an explicit opt-in (not global) so public routes like weather/forecast
 * stay unauthenticated.
 */
export async function authPlugin(app: FastifyInstance) {
  app.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'unauthorized', message: 'Missing bearer token' });
    }

    const token = header.slice('Bearer '.length);
    try {
      request.user = verifyToken(token);
    } catch {
      return reply.status(401).send({ error: 'unauthorized', message: 'Invalid or expired token' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from './password.js';
import { signToken } from './jwt.js';
import { createUser, findUserByEmail } from './user.repository.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_body',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, displayName } = parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
      return reply.status(409).send({ error: 'email_taken', message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash, displayName);
    const token = signToken({ userId: user.id, email: user.email });

    return reply.status(201).send({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  });

  app.post('/v1/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_body',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;
    const user = await findUserByEmail(email);

    // Same error for "no such user" and "wrong password" — don't leak
    // which one it was.
    const invalidCredentials = () =>
      reply.status(401).send({ error: 'invalid_credentials', message: 'Email or password is incorrect' });

    if (!user) return invalidCredentials();

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return invalidCredentials();

    const token = signToken({ userId: user.id, email: user.email });
    return reply.send({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  });
}

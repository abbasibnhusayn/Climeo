import { describe, it, expect, beforeAll } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
});

describe('JWT sign/verify', () => {
  it('round-trips a payload', () => {
    const token = signToken({ userId: 'user-123', email: 'test@example.com' });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('user-123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('rejects a tampered token', () => {
    const token = signToken({ userId: 'user-123', email: 'test@example.com' });
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(tampered)).toThrow();
  });
});

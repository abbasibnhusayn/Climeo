import jwt from 'jsonwebtoken';

export interface ClimeoJwtPayload {
  userId: string;
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required — see .env.example');
  }
  return secret;
}

export function signToken(payload: ClimeoJwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '30d';
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): ClimeoJwtPayload {
  return jwt.verify(token, getSecret()) as ClimeoJwtPayload;
}

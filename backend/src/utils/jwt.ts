import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types';
import { UnauthorizedError } from './errors';

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateToken(userId: string, organizationId: string, role: string, email: string): string {
  return jwt.sign(
    { userId, organizationId, role, email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions,
  );
}

export function verifyToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

import { Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, AuthUser, UserRole } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

interface JwtPayload {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user: AuthUser = {
      id: decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required roles: ${roles.join(', ')}`,
        ),
      );
      return;
    }

    next();
  };
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions,
  );
}

export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions,
  );
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

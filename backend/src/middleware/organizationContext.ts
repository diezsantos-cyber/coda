import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';

export function organizationContext(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user?.organizationId) {
    next(new UnauthorizedError('Organization context required'));
    return;
  }
  next();
}

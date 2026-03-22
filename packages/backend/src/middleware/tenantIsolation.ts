import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TenantIsolationError, UnauthorizedError } from '../utils/errors';

/**
 * Middleware that enforces multi-tenant data isolation.
 * Ensures all queries are scoped to the authenticated user's organization.
 */
export function enforceTenantIsolation(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required for tenant isolation'));
    return;
  }

  const orgIdFromParams = req.params['organizationId'];
  if (orgIdFromParams && orgIdFromParams !== req.user.organizationId) {
    next(new TenantIsolationError());
    return;
  }

  const orgIdFromBody = (req.body as Record<string, unknown>)?.['organizationId'];
  if (
    orgIdFromBody &&
    typeof orgIdFromBody === 'string' &&
    orgIdFromBody !== req.user.organizationId
  ) {
    next(new TenantIsolationError());
    return;
  }

  const orgIdFromQuery = req.query['organizationId'];
  if (
    orgIdFromQuery &&
    typeof orgIdFromQuery === 'string' &&
    orgIdFromQuery !== req.user.organizationId
  ) {
    next(new TenantIsolationError());
    return;
  }

  next();
}

/**
 * Helper to get the organization ID from the authenticated request.
 * Throws if no user is authenticated.
 */
export function getOrganizationId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user.organizationId;
}

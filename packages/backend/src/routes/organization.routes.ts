import { Router, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';
import { authenticate } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { validate } from '../middleware/validate';
import {
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../validators/organization';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await organizationService.getOrganization(req.user!.organizationId);
      res.status(200).json({
        success: true,
        message: 'Organization retrieved',
        data: org,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/',
  validate({ body: updateOrganizationSchema.shape.body }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await organizationService.updateOrganization(
        req.user!.organizationId,
        req.user!.id,
        req.body as { name?: string; description?: string; settings?: Record<string, unknown> },
      );
      res.status(200).json({
        success: true,
        message: 'Organization updated',
        data: org,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/members',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const members = await organizationService.getMembers(req.user!.organizationId);
      res.status(200).json({
        success: true,
        message: 'Members retrieved',
        data: members,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/members/invite',
  validate({ body: inviteMemberSchema.shape.body }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invite = await organizationService.inviteMember(
        req.user!.organizationId,
        req.user!.id,
        req.body as { email: string; role: 'ADMIN' | 'MEMBER' | 'VIEWER' },
      );
      res.status(201).json({
        success: true,
        message: 'Invite sent',
        data: invite,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/members/:memberId/role',
  validate({
    body: updateMemberRoleSchema.shape.body,
    params: updateMemberRoleSchema.shape.params,
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await organizationService.updateMemberRole(
        req.user!.organizationId,
        req.user!.id,
        req.params['memberId']!,
        (req.body as { role: string }).role,
      );
      res.status(200).json({
        success: true,
        message: 'Member role updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/members/:memberId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await organizationService.removeMember(
        req.user!.organizationId,
        req.user!.id,
        req.params['memberId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Member removed',
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

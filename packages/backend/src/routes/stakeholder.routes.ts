import { Router, Response, NextFunction } from 'express';
import { stakeholderService } from '../services/stakeholder.service';
import { authenticate } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { validate } from '../middleware/validate';
import {
  addStakeholderSchema,
  updateStakeholderSchema,
  removeStakeholderSchema,
} from '../validators/stakeholder';
import { AuthenticatedRequest } from '../types';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(enforceTenantIsolation);

router.post(
  '/',
  validate({
    body: addStakeholderSchema.shape.body,
    params: addStakeholderSchema.shape.params,
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stakeholder = await stakeholderService.addStakeholder(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.body as { userId: string; role: 'DECISION_MAKER' | 'CONTRIBUTOR' | 'REVIEWER' | 'OBSERVER' },
      );
      res.status(201).json({
        success: true,
        message: 'Stakeholder added',
        data: stakeholder,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stakeholders = await stakeholderService.getStakeholders(
        req.user!.organizationId,
        req.params['decisionId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Stakeholders retrieved',
        data: stakeholders,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:stakeholderId',
  validate({
    body: updateStakeholderSchema.shape.body,
    params: updateStakeholderSchema.shape.params,
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stakeholder = await stakeholderService.updateStakeholder(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.params['stakeholderId']!,
        req.body as { role: 'DECISION_MAKER' | 'CONTRIBUTOR' | 'REVIEWER' | 'OBSERVER' },
      );
      res.status(200).json({
        success: true,
        message: 'Stakeholder updated',
        data: stakeholder,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:stakeholderId',
  validate({ params: removeStakeholderSchema.shape.params }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await stakeholderService.removeStakeholder(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.params['stakeholderId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Stakeholder removed',
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

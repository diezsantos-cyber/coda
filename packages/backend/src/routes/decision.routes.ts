import { Router, Response, NextFunction } from 'express';
import { decisionService } from '../services/decision.service';
import { authenticate } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { validate } from '../middleware/validate';
import {
  createDecisionSchema,
  updateDecisionSchema,
  listDecisionsSchema,
  decisionIdParamSchema,
} from '../validators/decision';
import { AuthenticatedRequest, DecisionCategory, DecisionStatus } from '../types';

const router = Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

router.post(
  '/',
  validate({ body: createDecisionSchema.shape.body }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const decision = await decisionService.create(
        req.user!.organizationId,
        req.user!.id,
        req.body as {
          title: string;
          description?: string;
          category: DecisionCategory;
          deadline?: string;
          options?: Array<{ title: string; description?: string }>;
          tags?: string[];
        },
      );
      res.status(201).json({
        success: true,
        message: 'Decision created',
        data: decision,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/',
  validate({ query: listDecisionsSchema.shape.query }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await decisionService.list(
        req.user!.organizationId,
        req.query as {
          page?: string;
          limit?: string;
          status?: DecisionStatus;
          category?: DecisionCategory;
          search?: string;
          sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'title';
          sortOrder?: 'asc' | 'desc';
        },
      );
      res.status(200).json({
        success: true,
        message: 'Decisions retrieved',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:decisionId',
  validate({ params: decisionIdParamSchema.shape.params }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const decision = await decisionService.getById(
        req.user!.organizationId,
        req.params['decisionId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Decision retrieved',
        data: decision,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:decisionId',
  validate({
    body: updateDecisionSchema.shape.body,
    params: updateDecisionSchema.shape.params,
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const decision = await decisionService.update(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.body as {
          title?: string;
          description?: string;
          category?: DecisionCategory;
          status?: DecisionStatus;
          deadline?: string | null;
          selectedOptionId?: string | null;
          tags?: string[];
        },
      );
      res.status(200).json({
        success: true,
        message: 'Decision updated',
        data: decision,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:decisionId',
  validate({ params: decisionIdParamSchema.shape.params }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await decisionService.delete(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Decision deleted',
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

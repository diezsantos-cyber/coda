import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { agreementService } from '../services/AgreementService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate);
router.use(organizationContext);

const createAgreementSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  meetingId: z.string().uuid().optional(),
  minuteId: z.string().uuid().optional(),
  assignedToUserId: z.string().uuid().optional(),
  assignedToMemberId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

const updateAgreementSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
  assignedToMemberId: z.string().uuid().nullable().optional(),
});

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await agreementService.list(req.user!.organizationId, req.query as Record<string, unknown>);
      res.status(200).json({ success: true, message: 'Agreements retrieved', ...result });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  validate({ body: createAgreementSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agreement = await agreementService.create(req.user!.organizationId, req.body as z.infer<typeof createAgreementSchema>);
      res.status(201).json({ success: true, message: 'Agreement created', data: agreement });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agreement = await agreementService.getById(req.user!.organizationId, String(req.params['id']));
      res.status(200).json({ success: true, message: 'Agreement retrieved', data: agreement });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  validate({ body: updateAgreementSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agreement = await agreementService.update(req.user!.organizationId, String(req.params['id']), req.body as z.infer<typeof updateAgreementSchema>);
      res.status(200).json({ success: true, message: 'Agreement updated', data: agreement });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await agreementService.delete(req.user!.organizationId, String(req.params['id']));
      res.status(200).json({ success: true, message: 'Agreement deleted' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

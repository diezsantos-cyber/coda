import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { teamMemberService } from '../services/TeamMemberService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate);
router.use(organizationContext);

const createTeamMemberSchema = z.object({
  telegramId: z.string().min(1),
  telegramUsername: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

const updateTeamMemberSchema = z.object({
  telegramUsername: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const members = await teamMemberService.list(req.user!.organizationId);
      res.status(200).json({ success: true, message: 'Team members retrieved', data: members });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  validate({ body: createTeamMemberSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const member = await teamMemberService.create(req.user!.organizationId, req.body as z.infer<typeof createTeamMemberSchema>);
      res.status(201).json({ success: true, message: 'Team member added', data: member });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  validate({ body: updateTeamMemberSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const member = await teamMemberService.update(req.user!.organizationId, String(req.params['id']), req.body as z.infer<typeof updateTeamMemberSchema>);
      res.status(200).json({ success: true, message: 'Team member updated', data: member });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await teamMemberService.remove(req.user!.organizationId, String(req.params['id']));
      res.status(200).json({ success: true, message: 'Team member removed' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { minuteService } from '../services/MinuteService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router({ mergeParams: true });
router.use(authenticate);
router.use(organizationContext);

const createMinuteSchema = z.object({
  content: z.string().min(1),
  summary: z.string().optional(),
  topicsDiscussed: z.array(z.string()).optional(),
});

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const minute = await minuteService.getByMeetingId(req.user!.organizationId, String(req.params['meetingId']));
      res.status(200).json({ success: true, message: 'Minute retrieved', data: minute });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  validate({ body: createMinuteSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const minute = await minuteService.createOrUpdate(
        req.user!.organizationId,
        String(req.params['meetingId']),
        req.user!.userId,
        req.body as z.infer<typeof createMinuteSchema>,
      );
      res.status(201).json({ success: true, message: 'Minute saved', data: minute });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/publish',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const published = await minuteService.publish(req.user!.organizationId, String(req.params['meetingId']));
      res.status(200).json({ success: true, message: 'Minute published', data: published });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

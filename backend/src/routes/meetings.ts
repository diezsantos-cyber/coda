import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { meetingService } from '../services/MeetingService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate);
router.use(organizationContext);

const createMeetingSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  agenda: z.string().optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  location: z.string().max(255).optional(),
  participants: z.array(z.object({
    userId: z.string().uuid().optional(),
    teamMemberId: z.string().uuid().optional(),
    role: z.enum(['organizer', 'secretary', 'attendee']).optional(),
  })).optional(),
});

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  agenda: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  location: z.string().max(255).optional(),
});

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await meetingService.list(req.user!.organizationId, req.query as Record<string, unknown>);
      res.status(200).json({ success: true, message: 'Meetings retrieved', ...result });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  validate({ body: createMeetingSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meeting = await meetingService.create(req.user!.organizationId, req.user!.userId, req.body as z.infer<typeof createMeetingSchema>);
      res.status(201).json({ success: true, message: 'Meeting created', data: meeting });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meeting = await meetingService.getById(req.user!.organizationId, String(req.params['id']));
      res.status(200).json({ success: true, message: 'Meeting retrieved', data: meeting });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  validate({ body: updateMeetingSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meeting = await meetingService.update(req.user!.organizationId, String(req.params['id']), req.body as z.infer<typeof updateMeetingSchema>);
      res.status(200).json({ success: true, message: 'Meeting updated', data: meeting });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await meetingService.delete(req.user!.organizationId, String(req.params['id']));
      res.status(200).json({ success: true, message: 'Meeting cancelled' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/:id/participants',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await meetingService.addParticipants(
        req.user!.organizationId,
        String(req.params['id']),
        req.body as Array<{ userId?: string; teamMemberId?: string; role?: string }>,
      );
      res.status(201).json({ success: true, message: 'Participants added', data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id/participants/:participantId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await meetingService.removeParticipant(req.user!.organizationId, String(req.params['id']), String(req.params['participantId']));
      res.status(200).json({ success: true, message: 'Participant removed' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

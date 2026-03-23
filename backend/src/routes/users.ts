import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/UserService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate);
router.use(organizationContext);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
  role: z.enum(['admin', 'secretary', 'viewer']).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['admin', 'secretary', 'viewer']).optional(),
  email: z.string().email().optional(),
});

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userService.list(req.user!.organizationId);
      res.status(200).json({ success: true, message: 'Users retrieved', data: users });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  validate({ body: createUserSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.create(req.user!.organizationId, req.body as z.infer<typeof createUserSchema>);
      res.status(201).json({ success: true, message: 'User created', data: user });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  validate({ body: updateUserSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.update(req.user!.organizationId, String(req.params['id']), req.body as z.infer<typeof updateUserSchema>);
      res.status(200).json({ success: true, message: 'User updated', data: user });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.deactivate(req.user!.organizationId, String(req.params['id']));
      res.status(200).json({ success: true, message: 'User deactivated' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  organizationName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/register',
  validate({ body: registerSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body as z.infer<typeof registerSchema>);
      res.status(201).json({ success: true, message: 'Registration successful', data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body as z.infer<typeof loginSchema>);
      res.status(200).json({ success: true, message: 'Login successful', data: result });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      res.status(200).json({ success: true, message: 'Profile retrieved', data: profile });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

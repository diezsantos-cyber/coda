import { Router, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/register',
  validate({ body: registerSchema.shape.body }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        organizationName: string;
      });
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/login',
  validate({ body: loginSchema.shape.body }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body as {
        email: string;
        password: string;
      });
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/refresh',
  validate({ body: refreshTokenSchema.shape.body }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await authService.refreshToken(refreshToken);
      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
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
      const user = req.user!;
      const profile = await authService.getProfile(user.id);
      res.status(200).json({
        success: true,
        message: 'Profile retrieved',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

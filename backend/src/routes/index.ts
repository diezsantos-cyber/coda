import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import teamMemberRoutes from './teamMembers';
import meetingRoutes from './meetings';
import minuteRoutes from './minutes';
import agreementRoutes from './agreements';
import telegramRoutes from './telegram';
import integrationRoutes from './integrations';
import dashboardRoutes from './dashboard';

const router = Router();

router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'CODA API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env['NODE_ENV'] ?? 'development',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/team-members', teamMemberRoutes);
router.use('/meetings', meetingRoutes);
router.use('/meetings/:meetingId/minutes', minuteRoutes);
router.use('/agreements', agreementRoutes);
router.use('/telegram', telegramRoutes);
router.use('/integrations', integrationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

import { Router, Response, NextFunction } from 'express';
import { dashboardService } from '../services/DashboardService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate);
router.use(organizationContext);

router.get(
  '/stats',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await dashboardService.getStats(req.user!.organizationId);
      res.status(200).json({ success: true, message: 'Dashboard stats retrieved', data: stats });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

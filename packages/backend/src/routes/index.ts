import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import organizationRoutes from './organization.routes';
import decisionRoutes from './decision.routes';
import stakeholderRoutes from './stakeholder.routes';
import voteRoutes from './vote.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);
router.use('/decisions', decisionRoutes);
router.use('/decisions/:decisionId/stakeholders', stakeholderRoutes);
router.use('/decisions/:decisionId/votes', voteRoutes);

export default router;

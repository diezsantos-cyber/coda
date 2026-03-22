import { Router, Response, NextFunction } from 'express';
import { voteService } from '../services/vote.service';
import { authenticate } from '../middleware/auth';
import { enforceTenantIsolation } from '../middleware/tenantIsolation';
import { validate } from '../middleware/validate';
import { castVoteSchema, updateVoteSchema } from '../validators/vote';
import { AuthenticatedRequest } from '../types';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(enforceTenantIsolation);

router.post(
  '/',
  validate({
    body: castVoteSchema.shape.body,
    params: castVoteSchema.shape.params,
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vote = await voteService.castVote(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.body as { optionId: string; type: 'APPROVE' | 'REJECT' | 'ABSTAIN'; comment?: string },
      );
      res.status(201).json({
        success: true,
        message: 'Vote cast',
        data: vote,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const votes = await voteService.getVotes(
        req.user!.organizationId,
        req.params['decisionId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Votes retrieved',
        data: votes,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/summary',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await voteService.getVoteSummary(
        req.user!.organizationId,
        req.params['decisionId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Vote summary retrieved',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/:voteId',
  validate({
    body: updateVoteSchema.shape.body,
    params: updateVoteSchema.shape.params,
  }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vote = await voteService.updateVote(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.params['voteId']!,
        req.body as { optionId?: string; type?: 'APPROVE' | 'REJECT' | 'ABSTAIN'; comment?: string },
      );
      res.status(200).json({
        success: true,
        message: 'Vote updated',
        data: vote,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:voteId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await voteService.deleteVote(
        req.user!.organizationId,
        req.user!.id,
        req.params['decisionId']!,
        req.params['voteId']!,
      );
      res.status(200).json({
        success: true,
        message: 'Vote deleted',
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import { Router, Response, NextFunction } from 'express';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { authenticate } from '../middleware/auth';
import { organizationContext } from '../middleware/organizationContext';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/google/auth',
  authenticate,
  organizationContext,
  (_req: AuthenticatedRequest, res: Response): void => {
    const authUrl = googleSheetsService.getAuthUrl();
    res.status(200).json({ success: true, message: 'OAuth URL generated', data: { authUrl } });
  },
);

router.get(
  '/google/callback',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query['code'] as string;
      if (!code) {
        res.status(400).json({ success: false, error: 'Missing authorization code' });
        return;
      }
      await googleSheetsService.handleCallback(req.user!.organizationId, code);
      res.status(200).json({ success: true, message: 'Google OAuth connected' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/google/sheets/configure',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { spreadsheetId, sheetName } = req.body as { spreadsheetId: string; sheetName?: string };
      await googleSheetsService.configureSpreadsheet(req.user!.organizationId, spreadsheetId, sheetName);
      res.status(200).json({ success: true, message: 'Spreadsheet configured' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/google/sheets/sync',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { minuteId } = req.body as { minuteId: string };
      await googleSheetsService.exportMinuteToSheets(minuteId, req.user!.organizationId);
      res.status(200).json({ success: true, message: 'Sync completed' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

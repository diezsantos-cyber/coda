import { Router, Response, NextFunction } from 'express';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { googleCalendarService } from '../services/GoogleCalendarService';
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

// Google Calendar endpoints
router.post(
  '/google/calendar/auth',
  authenticate,
  organizationContext,
  (_req: AuthenticatedRequest, res: Response): void => {
    const authUrl = googleCalendarService.getAuthUrl();
    res.status(200).json({ success: true, message: 'Calendar OAuth URL generated', data: { authUrl } });
  },
);

router.get(
  '/google/calendar/callback',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query['code'] as string;
      if (!code) {
        res.status(400).json({ success: false, error: 'Missing authorization code' });
        return;
      }
      await googleCalendarService.handleCallback(req.user!.organizationId, code);
      res.status(200).json({ success: true, message: 'Google Calendar connected successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/google/calendar/configure',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { calendarId } = req.body as { calendarId: string };
      if (!calendarId) {
        res.status(400).json({ success: false, error: 'calendarId is required' });
        return;
      }
      await googleCalendarService.configureCalendar(req.user!.organizationId, calendarId);
      res.status(200).json({ success: true, message: 'Calendar configured successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/google/calendar/sync',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await googleCalendarService.syncEvents(req.user!.organizationId);
      res.status(200).json({ 
        success: true, 
        message: 'Calendar sync completed', 
        data: result 
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/google/calendar/upcoming',
  authenticate,
  organizationContext,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query['limit'] as string) || 10;
      const meetings = await googleCalendarService.getUpcomingMeetings(req.user!.organizationId, limit);
      res.status(200).json({ success: true, data: meetings });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { wsService } from '../services/websocket.service';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
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

router.get('/detailed', async (_req: Request, res: Response): Promise<void> => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: dbStatus === 'connected',
    message: dbStatus === 'connected' ? 'All systems operational' : 'Some services are degraded',
    data: {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbStatus,
        websocket: {
          status: 'active',
          connections: wsService.getConnectionCount(),
        },
      },
    },
  });
});

export default router;

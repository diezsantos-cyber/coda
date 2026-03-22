import http from 'http';
import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { wsService } from './services/websocket.service';

const server = http.createServer(app);

// Initialize WebSocket
wsService.initialize(server);

async function start(): Promise<void> {
  try {
    await connectDatabase();

    server.listen(config.port, () => {
      console.info(`CODA API server running on port ${config.port}`);
      console.info(`Environment: ${config.nodeEnv}`);
      console.info(`Health check: http://localhost:${config.port}/api/v1/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown(signal: string): void {
  console.info(`${signal} received. Starting graceful shutdown...`);

  wsService.shutdown();

  server.close(async () => {
    await disconnectDatabase();
    console.info('Server shut down gracefully');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

void start();

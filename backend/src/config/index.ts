import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  jwt: {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '24h',
  },
  cors: {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  },
  telegram: {
    botToken: process.env['TELEGRAM_BOT_TOKEN'] ?? '',
    webhookSecret: process.env['TELEGRAM_WEBHOOK_SECRET'] ?? '',
  },
  google: {
    clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    redirectUri: process.env['GOOGLE_REDIRECT_URI'] ?? 'http://localhost:3001/api/integrations/google/callback',
  },
  googleCalendar: {
    clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    redirectUri: process.env['GOOGLE_CALENDAR_REDIRECT_URI'] ?? 'http://localhost:3001/api/integrations/google/calendar/callback',
  },
  googleSheets: {
    clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
    redirectUri: process.env['GOOGLE_SHEETS_REDIRECT_URI'] ?? 'http://localhost:3001/api/integrations/google/sheets/callback',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
};

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config: Config = {
  port: parseInt(getEnvVar('PORT', '4000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  database: {
    url: getEnvVar('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/coda?schema=public'),
  },
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  },
  rateLimit: {
    windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(getEnvVar('RATE_LIMIT_MAX', '100'), 10),
  },
};

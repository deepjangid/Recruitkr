import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const emptyToUndefined = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  BCRYPT_OR_ARGON2_PEPPER: z.string().min(16),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  OPENAI_MODEL: z.string().min(3).default('gpt-4o-mini'),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BACKEND_PUBLIC_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  PASSWORD_RESET_EXPIRES_MIN: z.coerce.number().int().positive().default(30),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_FROM: z.preprocess(emptyToUndefined, z.string().min(3).optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;


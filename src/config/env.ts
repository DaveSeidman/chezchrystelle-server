import { config } from 'dotenv';
import { z } from 'zod';

config();

const booleanFromEnv = z
  .enum(['true', 'false'])
  .optional()
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8000),
  MONGODB_URI: z.string().min(1),
  CLIENT_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default(''),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),
  INITIAL_ADMIN_EMAILS: z.string().optional(),
  BUSINESS_TIME_ZONE: z.string().default('America/New_York'),
  DEV_AUTH_ENABLED: booleanFromEnv,
  DEV_AUTH_EMAIL: z.string().optional().default('localadmin@example.com'),
  DEV_AUTH_NAME: z.string().optional().default('Local Admin')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const googleAuthEnabled = Boolean(
  parsed.data.GOOGLE_CLIENT_ID &&
    parsed.data.GOOGLE_CLIENT_SECRET &&
    parsed.data.GOOGLE_CALLBACK_URL
);

const emailEnabled = Boolean(parsed.data.RESEND_API_KEY && parsed.data.EMAIL_FROM);

if (parsed.data.NODE_ENV === 'production' && !googleAuthEnabled) {
  console.error('Google auth env vars are required in production');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  googleAuthEnabled,
  emailEnabled,
  initialAdminEmails: (parsed.data.INITIAL_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
};

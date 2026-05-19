import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().default('sk_test_placeholder'),
  PAYMENTPOINT_SECRET_KEY: z.string().default('placeholder'),
  PAYMENTPOINT_API_KEY: z.string().default('placeholder'),
  PAYMENTPOINT_BUSINESS_ID: z.string().default('placeholder'),
  CHEAPDATAHUB_API_KEY: z.string().default('placeholder'),
  VTPASS_USERNAME: z.string().default('placeholder'),
  VTPASS_PASSWORD: z.string().default('placeholder'),
  VTPASS_BASE_URL: z.string().default('https://sandbox.vtpass.com/api'),
  
  // Email (SMTP) Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;

import "dotenv/config";
import type { StringValue } from "ms";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "5000",
  DATABASE_URL: process.env.DATABASE_URL as string,
  SALT_ROUND: parseInt(process.env.SALT_ROUND!),
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,

  JWT_SHORT_EXPIRY: process.env.JWT_SHORT_EXPIRY as StringValue,
  JWT_LONG_EXPIRY: process.env.JWT_LONG_EXPIRY as StringValue,

  CORS_ORIGIN: process.env.CORS_ORIGIN,

  EMAIL_USER: process.env.EMAIL_USER as string,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_USER as string,

  FRONTEND_URL: process.env.FRONTEND_URL,

  // SUPABASE_DISABLED: Replaced with Cloudflare R2
  // SUPABASE_URL: process.env.SUPABASE_URL as string,
  // SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  // SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || "giki",

  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID as string,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID as string,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY as string,
  R2_BUCKET: process.env.R2_BUCKET || "giki",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL as string,
};

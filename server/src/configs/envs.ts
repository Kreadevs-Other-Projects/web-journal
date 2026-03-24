import "dotenv/config";
import type { StringValue } from "ms";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL as string,
  SALT_ROUND: parseInt(process.env.SALT_ROUND!),
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,

  JWT_SHORT_EXPIRY: process.env.JWT_SHORT_EXPIRY as StringValue,
  JWT_LONG_EXPIRY: process.env.JWT_LONG_EXPIRY as StringValue,

  CORS_ORIGIN: process.env.CORS_ORIGIN,

  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_USER,

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};

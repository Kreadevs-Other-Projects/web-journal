import "dotenv/config";

export const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL as string,
  SALT_ROUND: parseInt(process.env.SALT_ROUND!),
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_SHORT_EXPIRY: process.env.JWT_SHORT_EXPIRY as string,
  JWT_LONG_EXPIRY: process.env.JWT_LONG_EXPIRY as string,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};

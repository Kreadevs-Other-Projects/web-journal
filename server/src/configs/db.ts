import { Pool } from "pg";
import { env } from "./envs";

declare global {
  var __pgPool: Pool | undefined;
}

const connectionString =
  env.DATABASE_URL || process.env.DATABASE_URL || process.env.DB_URL || "";

if (!connectionString) {
  console.warn("DATABASE_URL is missing. Database connection will fail.");
}

export const pool =
  global.__pgPool ||
  new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
          }
        : false,

    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

pool.on("connect", () => {
  console.log("Server is connected to Database");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

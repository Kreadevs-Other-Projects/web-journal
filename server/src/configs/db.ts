import { Pool } from "pg";
import { env } from "./envs";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

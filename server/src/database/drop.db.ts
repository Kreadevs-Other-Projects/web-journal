import { Client } from "pg";
import { env } from "../configs/envs";
import { withDbName } from "../configs/dbUrl";

const TARGET_DB = "giki-2";
const ADMIN_DB = "postgres";

(async () => {
  const adminUrl = withDbName(env.DATABASE_URL, ADMIN_DB);
  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();

    await client.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1
        AND pid <> pg_backend_pid();
      `,
      [TARGET_DB],
    );

    await client.query(`DROP DATABASE IF EXISTS "${TARGET_DB}"`);
    console.log(`🗑️ Database "${TARGET_DB}" dropped`);
  } catch (err) {
    console.error("❌ Drop DB failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

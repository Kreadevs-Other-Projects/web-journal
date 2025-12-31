import { Client } from "pg";
import { env } from "../configs/envs";
import { withDbName } from "../configs/dbUrl";

const TARGET_DB = "giki";
const ADMIN_DB = "postgres";

(async () => {
  const adminUrl = withDbName(env.DATABASE_URL, ADMIN_DB);

  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();

    const exists = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TARGET_DB]
    );

    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${TARGET_DB}"`);
      console.log(`✅ Database "${TARGET_DB}" created`);
    } else {
      console.log(`ℹ️ Database "${TARGET_DB}" already exists`);
    }
  } catch (err) {
    console.error("❌ Create DB failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

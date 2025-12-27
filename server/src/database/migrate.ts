import path from "path";
import fs from "fs";
import { pool } from "../configs/db";

export const runMigration = async () => {
  const migrateDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrateDir).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrateDir, file), {
      encoding: "utf-8",
    });
    console.log(`Running Migration file: ${file}`);
    await pool.query(sql);
  }
  console.log("Migration Completed!");
  process.exit(0);
};

runMigration();

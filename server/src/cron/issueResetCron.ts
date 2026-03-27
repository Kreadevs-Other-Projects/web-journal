import cron from "node-cron";
import { pool } from "../configs/db";

/**
 * Runs at 00:01 on January 1st each year.
 * Closes all open journal issues so editors must manually re-open for the new year.
 */
const issueResetCron = () => {
  cron.schedule("1 0 1 1 *", async () => {
    try {
      console.log("⏰ New Year cron: closing all open journal issues");
      const { rowCount } = await pool.query(
        `UPDATE journal_issues SET status = 'closed', updated_at = NOW() WHERE status = 'open'`
      );
      console.log(`✅ Closed ${rowCount} open issue(s) for new year reset`);
    } catch (error) {
      console.error("❌ Issue reset cron error:", error);
    }
  });
};

export const triggerIssueReset = async (): Promise<number> => {
  const { rowCount } = await pool.query(
    `UPDATE journal_issues SET status = 'closed', updated_at = NOW() WHERE status = 'open'`
  );
  return rowCount ?? 0;
};

export default issueResetCron;

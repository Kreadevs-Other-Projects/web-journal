import cron from "node-cron";
import { pool } from "../configs/db";

const journalSuspensionCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("⏰ Cron running: Journal auto-suspension check");

      const { rows } = await pool.query(`
        SELECT j.id
        FROM journals j
        WHERE 
          j.status != 'suspended'
          AND j.expiry_at < NOW()
          AND NOT EXISTS (
            SELECT 1 
            FROM journal_payments p
            WHERE 
              p.journal_id = j.id
              AND p.status = 'success'
              AND p.payment_type = 'renewal'
          )
      `);

      for (const journal of rows) {
        await pool.query(
          `UPDATE journals SET status = 'suspended' WHERE id = $1`,
          [journal.id],
        );
      }
    } catch (error) {
      console.error("❌ Journal suspension cron error:", error);
    }
  });
};

export default journalSuspensionCron;

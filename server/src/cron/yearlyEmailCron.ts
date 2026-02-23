import cron from "node-cron";
import { pool } from "../configs/db";
import { sendJournalExpiryInvoiceEmail } from "../utils/email";

const yearlyEmailCron = () => {
  // Runs every day at 12:00 AM
  cron.schedule("* * * * *", async () => {
    try {
      console.log(
        // "⏰ Cron job running: Yearly Email Task"
        "Cron running every minute",
      );

      const { rows } = await pool.query(`
        SELECT 
          j.id AS journal_id,
          j.title AS journal_name,
          j.expiry_at,
          u.email,
          u.username,
          p.id AS payment_id,
          p.amount,
          p.currency,
          p.status
        FROM journals j
        JOIN users u ON u.id = j.owner_id
        LEFT JOIN journal_payments p ON p.journal_id = j.id
        WHERE j.expiry_at::date = CURRENT_DATE
      `);

      for (const info of rows) {
        const expiryDate = new Date(info.expiry_at).toDateString();

        await sendJournalExpiryInvoiceEmail({
          email: info.email,
          username: info.username,
          journalName: info.journal_name,
          expiryDate,
          amount: info.amount,
          currency: info.currency,
          invoiceId: info.payment_id,
          status: info.status,
        });

        console.log(`📧 Invoice email sent → ${info.email}`);
      }
    } catch (error) {
      console.error("❌ Cron job error:", error);
    }
  });
};

export default yearlyEmailCron;

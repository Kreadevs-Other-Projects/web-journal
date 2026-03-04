import cron from "node-cron";
import { pool } from "../configs/db";
import {
  getJournalIssuesTotalAmount,
  createJournalPayment,
} from "../Api/owner/owner.reository";
import { sendJournalExpiryInvoiceEmail } from "../utils/email";

const yearlyEmailCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("⏰ Cron running: Midnight yearly expiry check");

      const { rows } = await pool.query(`
        SELECT 
          j.id,
          j.expiry_at
        FROM journals j
        WHERE DATE(j.expiry_at) = CURRENT_DATE
      `);

      console.log("Matched journals:", rows.length);

      for (const journal of rows) {
        const info = await getJournalIssuesTotalAmount(journal.id);
        if (!info) continue;

        const payment = await createJournalPayment({
          journalId: journal.id,
          ownerId: info.owner_id,
          issueId: null,
          amount: info.total_amount,
          status: "pending",
        });

        const expiryDate = new Date(info.expiry_at).toDateString();

        await sendJournalExpiryInvoiceEmail({
          email: info.email,
          username: info.username,
          journalName: info.journal_name,
          expiryDate,
          amount: payment.amount,
          currency: payment.currency,
          invoiceId: payment.id,
          status: payment.status,
        });

        console.log(`📧 Renewal invoice sent → ${info.email}`);
      }
    } catch (error) {
      console.error("❌ Cron job error:", error);
    }
  });
};

export default yearlyEmailCron;

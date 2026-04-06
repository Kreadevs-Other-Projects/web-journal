import { pool } from "../configs/db";
import { transporter } from "../configs/email";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  template?: string;
  paperId?: string;
  userId?: string;
}

export async function sendEmailWithLog(opts: EmailOptions): Promise<void> {
  let status = "sent";
  let errorMessage: string | undefined;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err: any) {
    status = "failed";
    errorMessage = err.message;
    throw err;
  } finally {
    pool
      .query(
        `INSERT INTO email_logs (recipient, subject, template, paper_id, user_id, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          opts.to,
          opts.subject,
          opts.template || null,
          opts.paperId || null,
          opts.userId || null,
          status,
          errorMessage || null,
        ],
      )
      .catch(() => {});
  }
}

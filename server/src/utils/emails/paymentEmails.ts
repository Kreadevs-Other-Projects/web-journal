import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

export const sendInvoiceEmail = async ({
  email,
  username,
  journalName,
  issueLabel,
  amount,
  currency,
  invoiceId,
  status,
}: {
  email: string;
  username: string;
  journalName: string;
  issueLabel: string;
  amount: number;
  currency: string;
  invoiceId: string;
  status: string;
}) => {
  await transporter.sendMail({
    from: `"Paperuno" <${env.EMAIL_FROM}>`,
    to: email,
    subject: `Invoice for Journal Issue (${status.toUpperCase()})`,
    html: baseEmailTemplate(
      "Journal Issue Invoice",
      `
        <p>Hi <strong>${username}</strong>,</p>
        <p>You have applied for a new journal issue. Below are the invoice details:</p>
        <p><strong>Journal:</strong> ${journalName}</p>
        <p><strong>Issue:</strong> ${issueLabel}</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Amount:</strong> ${amount} ${currency}</p>
        <p><strong>Status:</strong> <strong>${status.toUpperCase()}</strong></p>
        <a href="${env.CORS_ORIGIN}/dashboard/payments" class="button">Pay Now</a>
        <p>If unpaid, your issue will remain <strong>Pending</strong>.</p>
      `,
    ),
    text: `Invoice ${invoiceId} | Amount ${amount} ${currency} | Status ${status}`,
  });
};

export const sendPaperPaymentEmail = async ({
  email,
  username,
  title,
  paymentId,
  totalAmount,
  journalName,
  label,
}: {
  email: string;
  username: string;
  title: string;
  paymentId: string;
  pages: number;
  pricePerPage: number;
  totalAmount: number;
  journalName: string;
  label: string;
}) => {
  const status = "pending";

  await transporter.sendMail({
    from: `"Paperuno" <${env.EMAIL_FROM}>`,
    to: email,
    subject: `Invoice for Paper Payment (${status.toUpperCase()})`,
    html: baseEmailTemplate(
      "Paper Payment Invoice",
      `
        <p>Dear <strong>${username}</strong>,</p>
        <p>Your paper payment invoice has been generated successfully.</p>
        <p><strong>Journal Name:</strong> ${journalName}</p>
        <p><strong>Issue Label:</strong> ${label}</p>
        <p><strong>Paper Title:</strong> ${title}</p>
        <p><strong>Payment ID:</strong> ${paymentId}</p>
        <p><strong>Amount:</strong> ${totalAmount}</p>
        <p>Please complete the payment to proceed with the publication process.</p>
        <a href="${env.CORS_ORIGIN}/dashboard/payments" class="button">Pay Now</a>
        <p>If you have any questions, feel free to contact the editorial office.</p>
        <p>Best regards,<br/>Paperuno Editorial Team</p>
      `,
    ),
    text: `Invoice ${paymentId} | Amount $${totalAmount} | Status ${status}`,
  });
};

export const sendJournalExpiryInvoiceEmail = async ({
  email,
  username,
  journalName,
  expiryDate,
  amount,
  currency,
  invoiceId,
  status,
}: {
  email: string;
  username: string;
  journalName: string;
  expiryDate: string;
  amount: number;
  currency: string;
  invoiceId: string;
  status: string;
}) => {
  await transporter.sendMail({
    from: `"Paperuno" <${env.EMAIL_FROM}>`,
    to: email,
    subject: `Journal Renewal Invoice (${status.toUpperCase()})`,
    html: baseEmailTemplate(
      "Journal Subscription Renewal Invoice",
      `
        <p>Hi <strong>${username}</strong>,</p>
        <p>Your journal subscription is about to <strong>expire</strong>. Please find your renewal invoice details below:</p>
        <p><strong>Journal:</strong> ${journalName}</p>
        <p><strong>Expiry Date:</strong> ${expiryDate}</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Amount:</strong> ${amount} ${currency}</p>
        <p><strong>Status:</strong> <strong>${status.toUpperCase()}</strong></p>
        <a href="${env.CORS_ORIGIN}/dashboard/payments" class="button">Renew Now</a>
        <p><strong>Important:</strong> If payment is not completed before the expiry date, your journal access may be <strong>suspended</strong>.</p>
        <p>If you have already paid, please ignore this email.</p>
      `,
    ),
    text: `Renewal Invoice ${invoiceId} | Journal ${journalName} | Amount ${amount} ${currency} | Status ${status}`,
  });
};

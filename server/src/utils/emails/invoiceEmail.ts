import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

export function generateInvoiceEmailHtml(data: {
  authorName: string;
  authorEmail: string;
  paperTitle: string;
  journalName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  pages: number | null;
  pricePerPage: number;
  totalAmount: number;
  currency: string;
  publisherName: string;
}): string {
  const {
    authorName,
    authorEmail,
    paperTitle,
    journalName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    pages,
    pricePerPage,
    totalAmount,
    currency,
    publisherName,
  } = data;
  const pagesDisplay = pages != null ? String(pages) : "TBD";

  const paperUrl = `${env.CORS_ORIGIN || "http://localhost:5173"}/author`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4f8; font-family: Arial, sans-serif; color: #1a202c; }
    .wrapper { max-width: 640px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { color: #fff; }
    .header-left .org { font-size: 18px; font-weight: 700; }
    .header-left .org-sub { font-size: 12px; color: #bfdbfe; margin-top: 2px; }
    .header-right { text-align: right; }
    .invoice-label { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: 2px; }
    .body { padding: 32px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .meta-box h4 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 10px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #374151; }
    .meta-row .val { font-weight: 600; color: #1a202c; }
    .status-badge { display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
    .bill-to { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 28px; }
    .bill-to h4 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
    .bill-to p { font-size: 14px; color: #1a202c; font-weight: 600; }
    .bill-to span { font-size: 13px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1e3a8a; color: #fff; }
    thead th { padding: 10px 14px; font-size: 12px; font-weight: 700; text-align: left; letter-spacing: 0.5px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 12px 14px; font-size: 13px; color: #374151; vertical-align: top; border-bottom: 1px solid #e2e8f0; }
    .total-box { display: flex; justify-content: flex-end; margin-bottom: 28px; }
    .total-table { min-width: 220px; }
    .total-table tr td { padding: 5px 10px; font-size: 13px; }
    .total-table tr.grand-total td { border-top: 2px solid #1e3a8a; padding-top: 10px; font-size: 16px; font-weight: 800; color: #1e3a8a; }
    .payment-section { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .payment-section h4 { font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 10px; }
    .payment-section p { font-size: 13px; color: #374151; line-height: 1.6; margin-bottom: 8px; }
    .cta-btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 4px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-left">
        <div class="org">GIKI JournalHub</div>
        <div class="org-sub">${publisherName}</div>
      </div>
      <div class="header-right">
        <div class="invoice-label">INVOICE</div>
      </div>
    </div>

    <div class="body">
      <div class="meta-grid">
        <div class="meta-box">
          <h4>Invoice Details</h4>
          <div class="meta-row"><span>Invoice #</span><span class="val">${invoiceNumber}</span></div>
          <div class="meta-row"><span>Date</span><span class="val">${invoiceDate}</span></div>
          <div class="meta-row"><span>Due Date</span><span class="val">${dueDate}</span></div>
          <div class="meta-row"><span>Status</span><span class="status-badge">UNPAID</span></div>
        </div>
        <div class="meta-box">
          <h4>Bill To</h4>
          <p>${authorName}</p>
          <span>${authorEmail}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Pages</th>
            <th>Rate / Page</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Publication fee</strong><br />
              <span style="color:#64748b;font-size:12px;">&ldquo;${paperTitle}&rdquo;</span><br />
              <span style="color:#64748b;font-size:12px;">Journal: ${journalName}</span>
            </td>
            <td>${pagesDisplay}</td>
            <td>${currency} ${pricePerPage.toFixed(2)}</td>
            <td><strong>${currency} ${totalAmount.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="total-box">
        <table class="total-table">
          <tr><td>Subtotal</td><td style="text-align:right">${currency} ${totalAmount.toFixed(2)}</td></tr>
          <tr class="grand-total"><td>Total</td><td style="text-align:right">${currency} ${totalAmount.toFixed(2)}</td></tr>
        </table>
      </div>

      <div class="payment-section">
        <h4>Payment Instructions</h4>
        <p>Please transfer the amount of <strong>${currency} ${totalAmount.toFixed(2)}</strong> to the following bank account:</p>
        <p style="font-style:italic;color:#64748b;">Bank details will be provided by the editorial office upon request.</p>
        <p>After completing the payment, please upload your receipt on your paper tracking page so we can verify and proceed:</p>
        <a href="${paperUrl}" class="cta-btn">Upload Receipt →</a>
      </div>
    </div>

    <div class="footer">
      This is an automated invoice from ${publisherName} via GIKI JournalHub.<br />
      For queries, contact the editorial office. &copy; ${new Date().getFullYear()} GIKI JournalHub.
    </div>
  </div>
</body>
</html>`;
}

export const sendInvoiceEmail = async (data: {
  authorName: string;
  authorEmail: string;
  paperTitle: string;
  journalName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  pages: number | null;
  pricePerPage: number;
  totalAmount: number;
  currency: string;
  publisherName: string;
}) => {
  await transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: data.authorEmail,
    subject: `Invoice ${data.invoiceNumber} — Publication Fee for "${data.paperTitle}"`,
    html: generateInvoiceEmailHtml(data),
    text: `Invoice ${data.invoiceNumber} | Amount ${data.currency} ${data.totalAmount} | Due ${data.dueDate} | Paper: ${data.paperTitle}`,
  });
};

export const sendReceiptNotificationEmail = async (data: {
  publisherEmail: string;
  authorName: string;
  paperTitle: string;
  invoiceNumber: string;
  paperUrl: string;
}) => {
  await transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: data.publisherEmail,
    subject: `Receipt Uploaded — ${data.invoiceNumber} | "${data.paperTitle}"`,
    html: baseEmailTemplate(
      "Payment Receipt Uploaded",
      `
        <p>A payment receipt has been uploaded and requires your review.</p>
        <p><strong>Author:</strong> ${data.authorName}</p>
        <p><strong>Paper:</strong> "${data.paperTitle}"</p>
        <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
        <a href="${data.paperUrl}" class="button">Review in Dashboard →</a>
      `,
    ),
    text: `Receipt uploaded for "${data.paperTitle}" by ${data.authorName}. Invoice: ${data.invoiceNumber}.`,
  });
};

export const sendPaymentReminderEmail = async (data: {
  authorName: string;
  authorEmail: string;
  paperTitle: string;
  journalName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  currency: string;
  paperUrl: string;
}) => {
  const {
    authorName,
    authorEmail,
    paperTitle,
    journalName,
    invoiceNumber,
    invoiceDate,
    totalAmount,
    currency,
    paperUrl,
  } = data;

  await transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: authorEmail,
    subject: `Payment Reminder — Invoice #${invoiceNumber} for "${paperTitle}"`,
    html: baseEmailTemplate(
      "Payment Reminder",
      `
        <p>Dear <strong>${authorName}</strong>,</p>
        <p>This is a friendly reminder that your publication fee for the following paper is still outstanding:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#64748b;">Paper Title</span><span style="font-weight:600;">${paperTitle}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#64748b;">Journal</span><span style="font-weight:600;">${journalName}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#64748b;">Invoice #</span><span style="font-weight:600;">${invoiceNumber}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#64748b;">Amount Due</span><span style="font-weight:600;">${currency} ${Number(totalAmount).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;"><span style="color:#64748b;">Invoice Date</span><span style="font-weight:600;">${invoiceDate}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:#64748b;">Status</span><span style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700;">UNPAID</span></div>
        </div>
        <p>Please complete payment and upload your receipt:</p>
        <a href="${paperUrl}" class="button">Upload Receipt →</a>
        <p style="font-size:13px;color:#64748b;margin-top:16px;">If you have already made payment, please upload your receipt so we can verify and proceed.</p>
      `,
    ),
    text: `Payment Reminder | Invoice ${invoiceNumber} | ${currency} ${totalAmount} | Paper: "${paperTitle}"`,
  });
};

export const sendPaymentApprovalEmail = async (data: {
  authorEmail: string;
  authorName: string;
  paperTitle: string;
  approved: boolean;
  rejectionReason?: string;
}) => {
  const subject = data.approved
    ? `Payment Approved — "${data.paperTitle}"`
    : `Payment Receipt Rejected — "${data.paperTitle}"`;

  const content = data.approved
    ? `
        <p>Dear <strong>${data.authorName}</strong>,</p>
        <p>Your payment for the paper <strong>"${data.paperTitle}"</strong> has been <strong style="color:#16a34a;">approved</strong>.</p>
        <p>Your submission is now proceeding through the editorial workflow. Thank you for your payment.</p>
        <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/author" class="button">View Submission →</a>
      `
    : `
        <p>Dear <strong>${data.authorName}</strong>,</p>
        <p>Your payment receipt for the paper <strong>"${data.paperTitle}"</strong> has been <strong style="color:#dc2626;">rejected</strong>.</p>
        <p><strong>Reason:</strong> ${data.rejectionReason || "No reason provided."}</p>
        <p>Please upload a valid receipt to proceed with publication.</p>
        <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/author" class="button">Upload Receipt →</a>
      `;

  await transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: data.authorEmail,
    subject,
    html: baseEmailTemplate(
      data.approved ? "Payment Approved" : "Payment Receipt Rejected",
      content,
    ),
    text: subject,
  });
};

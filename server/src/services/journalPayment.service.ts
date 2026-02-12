import { createJournalPayment } from "../repositories/journalPayment.repository";
import { sendInvoiceEmail } from "../utils/email";

const ISSUE_PRICE = 5000;

export const createIssueInvoiceService = async ({
  user,
  journal,
  issue,
}: {
  user: any;
  journal: any;
  issue: any;
}) => {
  const payment = await createJournalPayment({
    journal_id: journal.id,
    issue_id: issue.id,
    owner_id: user.id,
    amount: ISSUE_PRICE,
  });

  await sendInvoiceEmail({
    email: user.email,
    username: user.username,
    journalName: journal.name,
    issueLabel: issue.label || `${issue.year}`,
    amount: payment.amount,
    currency: payment.currency,
    invoiceId: payment.id,
    status: payment.status,
  });

  return payment;
};

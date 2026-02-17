import {
  createChiefEditor,
  getAllChiefEditors,
  getAllPublishers,
  getJournalIssuesTotalAmount,
  getPendingJournal,
  getPendingJournalPayment,
  updateReceiptImage,
} from "../repositories/owner.reository";
import { sendJournalExpiryInvoiceEmail } from "../utils/email";
import { generatePassword, hashPassword } from "../utils/password";
import { createJournalPayment } from "../repositories/owner.reository";

export const fetchPublishers = async () => {
  return getAllPublishers();
};

export const fetchChiefEditors = async () => {
  return getAllChiefEditors();
};

export const createChiefEditorService = async (
  username: string,
  email: string,
) => {
  const plainPassword = generatePassword();
  const hashedPassword = await hashPassword(plainPassword);

  const user = await createChiefEditor(username, email, hashedPassword);

  return {
    user,
    generatedPassword: plainPassword,
  };
};

export const sendJournalExpiryInvoice = async (
  user: { id: string; role: string },
  journalId: string,
  expiryDate: string,
) => {
  if (user.role !== "owner") {
    throw new Error("Only Owner can send expiry invoices");
  }

  const info = await getJournalIssuesTotalAmount(journalId);

  if (!info) throw new Error("Journal not found");

  const payment = await createJournalPayment({
    journalId,
    ownerId: info.owner_id,
    issueId: null,
    amount: info.total_amount,
    status: "pending",
  });

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

  return payment;
};

export const uploadReceipt = async (paymentId: string, file: any) => {
  if (!file) throw new Error("Receipt file is required");

  const imagePath = `/uploads/${file.filename}`;

  const updated = await updateReceiptImage(paymentId, imagePath);

  if (!updated) throw new Error("Failed to update receipt");

  return updated;
};

export const getPendingJournalPay = async (journalId: string) => {
  const payment = await getPendingJournalPayment(journalId);

  return payment;
};

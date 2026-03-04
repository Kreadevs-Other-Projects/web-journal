import { Request, Response } from "express";
import {
  createChiefEditorService,
  fetchChiefEditors,
  fetchPublishers,
  sendJournalExpiryInvoice,
  uploadReceipt,
  getPendingJournalPay,
} from "./owner.service";
import { sendWelcomeEmail } from "../../utils/email";
import { AuthUser } from "../../middlewares/auth.middleware";
import { pool } from "../../configs/db";

export const getPublishers = async (req: Request, res: Response) => {
  const publishers = await fetchPublishers();
  return res.status(200).json({ success: true, data: publishers });
};

export const getChiefEditors = async (req: Request, res: Response) => {
  const chiefEditors = await fetchChiefEditors();
  return res.status(200).json({ success: true, data: chiefEditors });
};

export const createChiefEditor = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    const result = await createChiefEditorService(username, email);

    try {
      await sendWelcomeEmail(email, username, result.generatedPassword);
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Chief Editor created successfully",
      data: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid request",
    });
  }
};

export const sendJournalExpiry = async (req: AuthUser, res: Response) => {
  try {
    const user = req.user!;
    const { journalId } = req.params;
    const { expiryDate } = req.body;

    if (!expiryDate) {
      return res
        .status(400)
        .json({ success: false, message: "expiryDate required" });
    }

    const payment = await sendJournalExpiryInvoice(user, journalId, expiryDate);

    res.json({ success: true, data: payment });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadpaymentImage = async (req: AuthUser, res: Response) => {
  try {
    const { id } = req.params;

    const result = await uploadReceipt(id, req.file);

    res.json({
      success: true,
      message: "Receipt uploaded successfully",
      data: result,
    });
  } catch (err: any) {
    console.error("Upload Receipt Error:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
};

export const getPendingJournalPayment = async (req: Request, res: Response) => {
  try {
    const { journalId } = req.params;

    const payment = await getPendingJournalPay(journalId);

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (err: any) {
    console.error("Get Pending Payment Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to fetch pending payment",
    });
  }
};

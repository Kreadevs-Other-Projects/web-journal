import { Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  uploadReceiptService,
  approveOrRejectPaymentService,
  getPaymentByPaperService,
  getPendingPaymentsService,
  getAllPaperPaymentsService,
  getRejectedPaymentsService,
  sendPaymentReminderService,
} from "./paperPayment.service";

export const uploadReceipt = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const paperId = req.params.paperId;
    const receiptUrl = `uploads/receipts/${req.file.filename}`;

    const payment = await uploadReceiptService(paperId, req.user.id, receiptUrl);
    res.json({ success: true, payment });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const approveOrRejectPayment = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { paperId } = req.params;
    const { approved, rejection_reason } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({ success: false, message: "'approved' must be a boolean" });
    }

    const payment = await approveOrRejectPaymentService(
      paperId,
      req.user.id,
      approved,
      rejection_reason,
    );

    res.json({
      success: true,
      message: approved ? "Payment approved — paper moved to submitted" : "Payment rejected — author notified",
      payment,
    });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getPaymentForPaper = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const payment = await getPaymentByPaperService(
      req.params.paperId,
      req.user.id,
      req.user.role,
    );

    res.json({ success: true, payment });
  } catch (e: any) {
    const status = e.message === "Forbidden" ? 403 : e.message === "Payment not found" ? 404 : 400;
    res.status(status).json({ success: false, message: e.message });
  }
};

export const getPendingPayments = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const payments = await getPendingPaymentsService();
    res.json({ success: true, payments });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getAllPayments = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const payments = await getAllPaperPaymentsService();
    res.json({ success: true, payments });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getRejectedPayments = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const payments = await getRejectedPaymentsService();
    res.json({ success: true, payments });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const sendPaymentReminder = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { paperId } = req.params;
    const result = await sendPaymentReminderService(paperId);
    res.json({ success: true, message: `Reminder sent to ${result.authorEmail}`, authorEmail: result.authorEmail });
  } catch (e: any) {
    const status = e.message.includes("last 24 hours") ? 400 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};

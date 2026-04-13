import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { receiptUpload } from "../../middlewares/upload.middleware";
import {
  uploadReceipt,
  approveOrRejectPayment,
  getPaymentForPaper,
  getPendingPayments,
  getAllPayments,
  getRejectedPayments,
  sendPaymentReminder,
  resendInvoice,
} from "./paperPayment.controller";

const router = Router();

// Author uploads receipt
router.post(
  "/paper/:paperId/upload-receipt",
  authMiddleware,
  authorize("author"),
  receiptUpload.single("receipt"),
  uploadReceipt,
);

// Publisher approves or rejects
router.post(
  "/paper/:paperId/approve",
  authMiddleware,
  authorize("publisher"),
  approveOrRejectPayment,
);

// Get payment for a specific paper (author own, or publisher)
router.get(
  "/paper/:paperId",
  authMiddleware,
  getPaymentForPaper,
);

// Publisher: get all pending receipts
router.get(
  "/pending",
  authMiddleware,
  authorize("publisher"),
  getPendingPayments,
);

// Publisher: get all payments
router.get(
  "/all",
  authMiddleware,
  authorize("publisher"),
  getAllPayments,
);

// Publisher: get rejected payments
router.get(
  "/rejected",
  authMiddleware,
  authorize("publisher"),
  getRejectedPayments,
);

// Publisher: resend invoice email (no cooldown)
router.post(
  "/paper/:paperId/resend-invoice",
  authMiddleware,
  authorize("publisher"),
  resendInvoice,
);

// Publisher: send payment reminder email
router.post(
  "/paper/:paperId/remind",
  authMiddleware,
  authorize("publisher"),
  sendPaymentReminder,
);

export default router;

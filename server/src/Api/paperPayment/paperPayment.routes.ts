import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { receiptUpload } from "../../middlewares/upload.middleware";
import {
  uploadReceipt,
  approveOrRejectPayment,
  getPaymentForPaper,
  getPendingPayments,
  getAllPayments,
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

export default router;

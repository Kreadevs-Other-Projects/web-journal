import { Router } from "express";
import {
  approveJournal,
  getJournals,
  getIssues,
  publishIssue,
  getPapers,
  getPapersByIssueId,
  sendInvoice,
  sendPaymentEmail,
  approvePaper,
  getJournalPayments,
  updatePaymentStatus,
  replaceChiefEditor,
} from "./publisher.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";

const router = Router();

router.put(
  "/approveJournal/:journalId",
  authMiddleware,
  authorize("publisher"),
  approveJournal,
);

router.get("/getJournals", authMiddleware, authorize("publisher"), getJournals);

router.patch(
  "/journals/:journalId/chief-editor",
  authMiddleware,
  authorize("publisher"),
  replaceChiefEditor,
);

router.get(
  "/getIssues/:journalId",
  authMiddleware,
  authorize("publisher"),
  getIssues,
);

router.post(
  "/sendInvoice",
  authMiddleware,
  authorize("publisher"),
  sendInvoice,
);

router.put(
  "/publishIssue/:issueId",
  authMiddleware,
  authorize("publisher"),
  publishIssue,
);

router.get(
  "/getPapers/:journalId",
  authMiddleware,
  authorize("publisher"),
  getPapers,
);

router.get("/papers/:issueId", authMiddleware, getPapersByIssueId);

router.post("/sendEmail", authMiddleware, sendPaymentEmail);

router.put("/approve/:paymentId", approvePaper);

router.get(
  "/getJournalPayments",
  authMiddleware,
  authorize("publisher"),
  getJournalPayments,
);

router.put(
  "/updatePaymentStatus/:id",
  authMiddleware,
  authorize("publisher"),
  updatePaymentStatus,
);

export default router;

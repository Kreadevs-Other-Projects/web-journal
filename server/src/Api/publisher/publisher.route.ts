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
  replaceJournalManager,
  manualIssueReset,
  takedownJournal,
  restoreJournal,
  takedownIssue,
  restoreIssue,
  takedownPaper,
  restorePaper,
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

router.patch(
  "/journals/:journalId/journal-manager",
  authMiddleware,
  authorize("publisher"),
  replaceJournalManager,
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

// Manual trigger: close all open issues (new year reset)
router.post("/issues/reset-all", authMiddleware, authorize("publisher"), manualIssueReset);

// Takedown / restore
router.post("/journals/:journalId/takedown", authMiddleware, authorize("publisher"), takedownJournal);
router.post("/journals/:journalId/restore", authMiddleware, authorize("publisher"), restoreJournal);
router.post("/journals/:journalId/issues/:issueId/takedown", authMiddleware, authorize("publisher"), takedownIssue);
router.post("/journals/:journalId/issues/:issueId/restore", authMiddleware, authorize("publisher"), restoreIssue);
router.post("/papers/:paperId/takedown", authMiddleware, authorize("publisher"), takedownPaper);
router.post("/papers/:paperId/restore", authMiddleware, authorize("publisher"), restorePaper);

export default router;

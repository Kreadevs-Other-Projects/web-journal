import { Router } from "express";
import {
  approveJournal,
  getJournals,
  getIssues,
  createIssue,
  publishIssue,
  getPapers,
  getPapersByIssueId,
  sendInvoice,
  sendPaymentEmail,
} from "../controllers/publisher.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { zPublisherIssueSchema } from "../schemas/publisher.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.put(
  "/approveJournal/:journalId",
  authMiddleware,
  authorize("publisher"),
  approveJournal,
);

router.get("/getJournals", authMiddleware, authorize("publisher"), getJournals);

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

router.post(
  "/createIssue/:journalId",
  authMiddleware,
  authorize("publisher"),
  validate(zPublisherIssueSchema),
  createIssue,
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

export default router;

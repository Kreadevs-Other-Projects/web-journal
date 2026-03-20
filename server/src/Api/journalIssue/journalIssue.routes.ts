import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import {
  addJournalIssue,
  getJournalIssues,
  updateJournalIssue,
  deleteJournalIssue,
  requestNewIssue,
  getMyIssues,
  getMyIssueRequests,
  getPendingIssueRequests,
  reviewIssueRequest,
  getManagerPapers,
} from "./journalIssue.controller";
import {
  createJournalIssueSchema,
  updateJournalIssueSchema,
} from "./journalIssue.schema";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.post(
  "/addJournalIssue/:journalId",
  authMiddleware,
  authorize("owner", "publisher", "journal_manager"),
  validate(createJournalIssueSchema),
  addJournalIssue,
);

router.get(
  "/getJournalIssues/:journalId",
  authMiddleware,
  authorize("owner", "publisher", "journal_manager", "author"),
  getJournalIssues,
);

router.put(
  "/updateJournalIssue/:issueId",
  authMiddleware,
  authorize("owner", "publisher", "journal_manager"),
  validate(updateJournalIssueSchema),
  updateJournalIssue,
);

router.delete(
  "/deleteJournalIssue/:issueId",
  authMiddleware,
  authorize("owner", "publisher", "journal_manager"),
  deleteJournalIssue,
);

// Issue requests (Journal Manager ↔ Publisher)
router.get(
  "/my-issues",
  authMiddleware,
  authorize("journal_manager"),
  getMyIssues,
);

router.get(
  "/my-papers",
  authMiddleware,
  authorize("journal_manager"),
  getManagerPapers,
);

router.post(
  "/request",
  authMiddleware,
  authorize("journal_manager"),
  requestNewIssue,
);

router.get(
  "/:journalId/requests",
  authMiddleware,
  authorize("journal_manager"),
  getMyIssueRequests,
);

router.get(
  "/pending-requests",
  authMiddleware,
  authorize("publisher", "owner"),
  getPendingIssueRequests,
);

router.put(
  "/requests/:requestId/review",
  authMiddleware,
  authorize("publisher", "owner"),
  reviewIssueRequest,
);

export default router;

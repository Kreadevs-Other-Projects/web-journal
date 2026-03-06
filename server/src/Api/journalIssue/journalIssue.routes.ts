import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import {
  addJournalIssue,
  getJournalIssues,
  updateJournalIssue,
  deleteJournalIssue,
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
  authorize("owner", "publisher"),
  validate(createJournalIssueSchema),
  addJournalIssue,
);

router.get(
  "/getJournalIssues/:journalId",
  authMiddleware,
  authorize("owner", "publisher", "author"),
  getJournalIssues,
);

router.put(
  "/updateJournalIssue/:issueId",
  authMiddleware,
  authorize("owner", "publisher"),
  validate(updateJournalIssueSchema),
  updateJournalIssue,
);

router.delete(
  "/deleteJournalIssue/:issueId",
  authMiddleware,
  authorize("owner", "publisher"),
  deleteJournalIssue,
);

export default router;

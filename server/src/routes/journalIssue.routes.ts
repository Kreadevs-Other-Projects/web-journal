import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/auth.middleware";
import {
  addJournalIssue,
  getJournalIssues,
  updateJournalIssue,
  deleteJournalIssue,
} from "../controllers/journalIssue.controller";
import { updateJournalIssueSchema } from "../schemas/journalIssue.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.post(
  "/issues/:journalId",
  authMiddleware,
  authorize("owner"),
  addJournalIssue,
);

router.get(
  "/issues/:journalId",
  authMiddleware,
  authorize("owner", "admin"),
  getJournalIssues,
);

router.put(
  "/issues/:issueId",
  authMiddleware,
  authorize("owner"),
  validate(updateJournalIssueSchema),
  updateJournalIssue,
);

router.delete(
  "/issues/:issueId",
  authMiddleware,
  authorize("owner"),
  deleteJournalIssue,
);

export default router;

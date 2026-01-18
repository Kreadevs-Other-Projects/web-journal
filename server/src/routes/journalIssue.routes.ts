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
  "/addJournalIssue/:journalId",
  authMiddleware,
  authorize("owner"),
  addJournalIssue,
);

router.get(
  "/getJournalIssues/:journalId",
  authMiddleware,
  authorize("owner", "admin"),
  getJournalIssues,
);

router.put(
  "/updateJournalIssue/:issueId",
  authMiddleware,
  authorize("owner"),
  validate(updateJournalIssueSchema),
  updateJournalIssue,
);

router.delete(
  "/deleteJournalIssue/:issueId",
  authMiddleware,
  authorize("owner"),
  deleteJournalIssue,
);

export default router;

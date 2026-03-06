import { Router } from "express";
import { getAuthorJournals, getAuthorJournalIssues } from "./author.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";

const router = Router();

router.get(
  "/getAuthorJournals",
  authMiddleware,
  authorize("author"),
  getAuthorJournals,
);

router.get(
  "/getAuthorJournalIssues/:journalId",
  authMiddleware,
  authorize("author"),
  getAuthorJournalIssues,
);

export default router;

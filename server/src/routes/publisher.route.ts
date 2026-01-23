import { Router } from "express";
import {
  getJournals,
  getIssues,
  createIssue,
  publishIssue,
  getPapers,
  getPapersByIssueId,
  publishPaper,
} from "../controllers/publisher.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { zPublisherIssueSchema } from "../schemas/publisher.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.get("/getJournals", authMiddleware, authorize("publisher"), getJournals);

router.get(
  "/getIssues/:journalId",
  authMiddleware,
  authorize("publisher"),
  getIssues,
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

router.put(
  "/publishPaper/:paperId",
  authMiddleware,
  authorize("publisher"),
  publishPaper,
);

export default router;

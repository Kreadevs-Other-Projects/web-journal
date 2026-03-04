import { Router } from "express";
import {
  getChiefEditorJournals,
  getPapersByJournalId,
  getAllPapers,
  assignSubEditor,
  updatePaperStatus,
  decidePaper,
  fetchChiefEditors,
  fetchSubEditors,
  getSubmittedReviews,
  SubEditorInvite,
  getPapersByIssue,
  assignPaperToIssue,
  updateIssueStatus,
} from "./chiefEditor.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import {
  assignSubEditorSchema,
  editorDecisionSchema,
  paperStatusSchema,
} from "./chiefEditor.schema";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.get(
  "/getChiefEditorJournals",
  authMiddleware,
  authorize("chief_editor"),
  getChiefEditorJournals,
);

router.get(
  "/getPapers/:journalId",
  authMiddleware,
  authorize("chief_editor"),
  getPapersByJournalId,
);

router.get(
  "/getChiefEditors",
  authMiddleware,
  authorize("author", "admin", "owner", "publisher"),
  fetchChiefEditors,
);

router.get(
  "/getAllPapers",
  authMiddleware,
  authorize("chief_editor"),
  getAllPapers,
);

router.get(
  "/getsubEditors",
  authMiddleware,
  authorize("author", "chief_editor", "owner", "publisher"),
  fetchSubEditors,
);

router.post(
  "/assignSubEditor/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(assignSubEditorSchema),
  assignSubEditor,
);

router.post(
  "/decide/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(editorDecisionSchema),
  decidePaper,
);

router.put(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(paperStatusSchema),
  updatePaperStatus,
);

router.get(
  "/getSubmittedReviews",
  authMiddleware,
  authorize("chief_editor"),
  getSubmittedReviews,
);

router.post(
  "/inviteSubEditor",
  authMiddleware,
  authorize("chief_editor"),
  SubEditorInvite,
);

router.get("/getPapersByIssue/:issueId", getPapersByIssue);

router.post("/assignPaperToIssue", assignPaperToIssue);

router.put("/updateIssueStatus/:issueId", updateIssueStatus);

export default router;

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
  fetchReviewers,
  getSubmittedReviews,
  SubEditorInvite,
  getPapersByIssue,
  assignPaperToIssue,
  updateIssueStatus,
  getJournalDetails,
  getApplications,
  getApplicationsCount,
  inviteApplication,
  declineApplication,
  replaceSubEditor,
  getPaperDecisionHistory,
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
  "/getSubEditors",
  authMiddleware,
  authorize("author", "chief_editor", "owner", "publisher"),
  fetchSubEditors,
);

router.get(
  "/getReviewers",
  authMiddleware,
  authorize("chief_editor", "sub_editor"),
  fetchReviewers,
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

router.get(
  "/journals/:journalId/details",
  authMiddleware,
  authorize("chief_editor"),
  getJournalDetails,
);

router.get("/getPapersByIssue/:issueId", getPapersByIssue);

router.post("/assignPaperToIssue", assignPaperToIssue);

router.put("/updateIssueStatus/:issueId", updateIssueStatus);

// Replace associate editor
router.post(
  "/papers/:paperId/replace-ae",
  authMiddleware,
  authorize("chief_editor"),
  replaceSubEditor,
);

// Decision history
router.get(
  "/papers/:paperId/decision-history",
  authMiddleware,
  authorize("chief_editor", "sub_editor", "author"),
  getPaperDecisionHistory,
);

// Reviewer applications
router.get("/applications", authMiddleware, authorize("chief_editor"), getApplications);
router.get("/applications/count", authMiddleware, authorize("chief_editor"), getApplicationsCount);
router.post("/applications/:applicationId/invite", authMiddleware, authorize("chief_editor"), inviteApplication);
router.post("/applications/:applicationId/decline", authMiddleware, authorize("chief_editor"), declineApplication);

export default router;

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
  getCEStats,
  overridePaperStatus,
  remindAE,
  remindReviewer,
  remindAllReviewers,
  remindAEBulk,
  remindReviewerBulk,
  getJournalStaff,
  getStaffProfileHandler,
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

// Stats
router.get("/stats", authMiddleware, authorize("chief_editor"), getCEStats);

// Override paper status
router.post(
  "/papers/:paperId/override-status",
  authMiddleware,
  authorize("chief_editor"),
  overridePaperStatus,
);

// Reminders
router.post(
  "/papers/:paperId/remind-ae",
  authMiddleware,
  authorize("chief_editor"),
  remindAE,
);

router.post(
  "/papers/:paperId/remind-reviewer/:reviewerId",
  authMiddleware,
  authorize("chief_editor"),
  remindReviewer,
);

router.post(
  "/papers/:paperId/remind-reviewer",
  authMiddleware,
  authorize("chief_editor"),
  remindAllReviewers,
);

router.post(
  "/ae/:aeId/remind",
  authMiddleware,
  authorize("chief_editor"),
  remindAEBulk,
);

router.post(
  "/reviewer/:reviewerId/remind",
  authMiddleware,
  authorize("chief_editor"),
  remindReviewerBulk,
);

// Journal staff (AEs/reviewers) for assign pages
router.get(
  "/journals/:journalId/staff",
  authMiddleware,
  authorize("chief_editor", "sub_editor"),
  getJournalStaff,
);

// Staff member full profile (certifications + papers)
router.get(
  "/staff/:userId",
  authMiddleware,
  authorize("chief_editor", "sub_editor"),
  getStaffProfileHandler,
);

// Reviewer applications
router.get("/applications", authMiddleware, authorize("chief_editor"), getApplications);
router.get("/applications/count", authMiddleware, authorize("chief_editor"), getApplicationsCount);
router.post("/applications/:applicationId/invite", authMiddleware, authorize("chief_editor"), inviteApplication);
router.post("/applications/:applicationId/decline", authMiddleware, authorize("chief_editor"), declineApplication);

export default router;

import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { requireProfileCompleted } from "../../middlewares/profileCompleted.middleware";
import {
  sendInvitation,
  verifyInvitation,
  acceptInvitation,
  cancelInvitation,
  getJournalInvitations,
  getMyInvitations,
  resendInvitation,
} from "./invitation.controller";

const router = Router();

// Send invitation — publisher, chief_editor, sub_editor
router.post(
  "/send",
  authMiddleware,
  authorize("publisher", "chief_editor", "sub_editor", "owner"),
  requireProfileCompleted,
  sendInvitation,
);

// Verify token (public — no auth required)
router.get("/verify/:token", verifyInvitation);

// Accept invitation — set password and create account (public)
router.post("/accept/:token", acceptInvitation);

// Cancel invitation
router.delete(
  "/:invitationId/cancel",
  authMiddleware,
  authorize("publisher", "chief_editor", "owner"),
  cancelInvitation,
);

// List all invitations for a journal
router.get(
  "/journal/:journalId",
  authMiddleware,
  authorize("publisher", "chief_editor", "owner"),
  getJournalInvitations,
);

// List all pending invitations sent by the caller (CE's own invitations across journals)
router.get(
  "/mine",
  authMiddleware,
  authorize("publisher", "chief_editor", "owner"),
  getMyInvitations,
);

// Endpoint: POST /api/invitations/resend
router.post("/resend", resendInvitation);

export default router;

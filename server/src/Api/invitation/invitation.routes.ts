import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import {
  sendInvitation,
  verifyInvitation,
  acceptInvitation,
  cancelInvitation,
  getJournalInvitations,
  resendInvitation,
} from "./invitation.controller";

const router = Router();

// Send invitation — publisher, chief_editor, sub_editor
router.post(
  "/send",
  authMiddleware,
  authorize("publisher", "chief_editor", "sub_editor", "owner"),
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

// Endpoint: POST /api/invitations/resend
router.post("/resend", resendInvitation);

export default router;

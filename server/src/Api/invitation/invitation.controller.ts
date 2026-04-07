import { Request, Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  sendInvitationService,
  verifyInvitationService,
  acceptInvitationService,
  cancelInvitationService,
  getJournalInvitationsService,
  resendInvitationService,
} from "./invitation.service";

export const sendInvitation = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const result = await sendInvitationService(req.user as any, req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const verifyInvitation = async (req: Request, res: Response) => {
  try {
    const data = await verifyInvitationService(req.params.token);
    return res.json({ success: true, invitation: data });
  } catch (e: any) {
    const status = (e as any).statusCode || 400;
    return res.status(status).json({ success: false, message: e.message });
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    const result = await acceptInvitationService(req.params.token, password);
    return res.status(201).json({ success: true, ...result });
  } catch (e: any) {
    const status = (e as any).statusCode || 400;
    return res.status(status).json({ success: false, message: e.message });
  }
};

export const cancelInvitation = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const result = await cancelInvitationService(
      req.params.invitationId,
      req.user.id,
      req.user.role,
    );
    return res.json({ success: true, ...result });
  } catch (e: any) {
    return res.status(403).json({ success: false, message: e.message });
  }
};

export const getJournalInvitations = async (req: AuthUser, res: Response) => {
  try {
    const invitations = await getJournalInvitationsService(
      req.params.journalId,
    );
    return res.json({ success: true, invitations });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};
export const resendInvitation = async (req: AuthUser, res: Response) => {
  try {
    const { email, role, journal_id, chiedEditorName, title } = req.body;
    const username = req.user?.username || "";
    const result = await resendInvitationService(
      email,
      role,
      journal_id,
      username,
      chiedEditorName,
      title,
    );

    return res.json({ success: true, ...result });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

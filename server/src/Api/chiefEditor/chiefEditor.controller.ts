import { Request, Response } from "express";
import * as service from "./chiefEditor.service";
import { AuthUser } from "../../middlewares/auth.middleware";
import { pool } from "../../configs/db";
import { sendInvitationService } from "../invitation/invitation.service";
import { sendRejectionEmailToApplicant } from "../../utils/emails/reviewerApplicationEmail";
import { asyncHandler } from "../../utils/asyncHandler";

export const getChiefEditorJournals = async (req: AuthUser, res: Response) => {
  try {
    const chiefEditorId = req.user!.id;

    const journals = await service.getChiefEditorJournalsService(chiefEditorId);

    return res.status(200).json({
      success: true,
      journal: journals,
    });
  } catch (error: any) {
    console.error("[getChiefEditorJournals]", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch journals",
    });
  }
};

export const getPapersByJournalId = async (req: Request, res: Response) => {
  const { journalId } = req.params;

  const papers = await service.getPapersByJournalIdService(journalId);

  return res.status(200).json({
    success: true,
    papers: papers,
  });
};

export const fetchChiefEditors = async (req: Request, res: Response) => {
  const users = await service.getChiefEditors();

  res.json({
    success: true,
    data: users,
  });
};

export const getAllPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchAllPapers(req.user!.id);
  res.json({ success: true, data: papers });
};

export const fetchSubEditors = async (req: Request, res: Response) => {
  const users = await service.getSubEditors();

  res.json({
    success: true,
    data: users,
  });
};

export const fetchReviewers = async (req: Request, res: Response) => {
  const users = await service.getReviewers();

  res.json({
    success: true,
    data: users,
  });
};

export const assignSubEditor = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { subEditorId } = req.body;
    const assignedBy = req.user!.id;

    const assignment = await service.addSubEditor(
      paperId,
      subEditorId,
      assignedBy,
    );
    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      throw new Error(error.message || "Failed to create journal!");
    }
  }
};

export const decidePaper = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { decision, decision_note, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email and password are required to submit a decision",
        });
    }

    const result = await service.makeEditorDecision(
      paperId,
      req.user!.id,
      email,
      password,
      decision,
      decision_note || "",
    );

    res.json({
      success: true,
      message: "Editor decision saved successfully",
      data: result,
    });
  } catch (e: any) {
    const status =
      e.message.includes("Email does not match") ||
      e.message.includes("Incorrect password")
        ? 401
        : 400;
    res.status(status).json({ success: false, message: e.message });
  }
};

export const replaceSubEditor = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { newSubEditorId } = req.body;
    if (!newSubEditorId) {
      return res
        .status(400)
        .json({ success: false, message: "newSubEditorId is required" });
    }
    const result = await service.replaceSubEditorService(
      paperId,
      req.user!.id,
      newSubEditorId,
    );
    res.json({
      success: true,
      message: "Associate editor replaced successfully",
      data: result,
    });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getPaperDecisionHistory = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const history = await service.getPaperDecisionHistoryService(paperId);
    res.json({ success: true, history });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const updatePaperStatus = async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const { status } = req.body;

  const updatedPaper = await service.changePaperStatus(paperId, status);
  res.json({ success: true, data: updatedPaper });
};

export const getSubmittedReviews = async (req: AuthUser, res: Response) => {
  const chiefEditorId = req.user!.id;
  console.log(chiefEditorId);

  const reviews = await service.getSubmittedReviews(chiefEditorId);

  return res.status(200).json({ success: true, data: reviews });
};

export const SubEditorInvite = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await service.sendInviteEmailSubEditor(email);

    res.json({ message: "Invitation email sent successfully", data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getPapersByIssue = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;

    const papers = await service.getPapersByIssueService(issueId);

    res.json({
      success: true,
      papers,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignPaperToIssue = async (req: Request, res: Response) => {
  try {
    const { paperId, issueId } = req.body;

    const updatedPaper = await service.assignPaperToIssueService(
      paperId,
      issueId,
    );

    res.json({
      success: true,
      message: "Paper assigned to issue successfully",
      paper: updatedPaper,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJournalDetails = async (req: AuthUser, res: Response) => {
  try {
    const { journalId } = req.params;
    const data = await service.getJournalDetailsService(
      journalId,
      req.user!.id,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(404).json({ success: false, message: e.message });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;

    const updatedIssue = await service.updateIssueStatusService(
      issueId,
      status,
    );

    res.json({
      success: true,
      message: `Issue ${status} successfully`,
      issue: updatedIssue,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ===== REVIEWER APPLICATIONS =====

export const getApplications = async (req: AuthUser, res: Response) => {
  try {
    const ceId = req.user!.id;
    const status = (req.query.status as string) || "pending";
    const appliedRole = req.query.applied_role as string | undefined;

    // Get journal IDs this CE manages
    const journalsRes = await pool.query(
      `SELECT journal_id FROM user_roles WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true`,
      [ceId],
    );
    const journalIds = journalsRes.rows.map((r: any) => r.journal_id);
    if (!journalIds.length)
      return res.json({ success: true, applications: [] });

    const params: any[] = [journalIds, status];
    let roleClause = "";
    if (appliedRole === "reviewer" || appliedRole === "associate_editor") {
      params.push(appliedRole);
      roleClause = ` AND ra.applied_role = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT ra.*, j.title AS journal_name
       FROM reviewer_applications ra
       JOIN journals j ON j.id = ra.journal_id
       WHERE ra.journal_id = ANY($1::uuid[]) AND ra.status = $2${roleClause}
       ORDER BY ra.created_at DESC`,
      params,
    );
    res.json({ success: true, applications: result.rows });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getApplicationsCount = async (req: AuthUser, res: Response) => {
  try {
    const ceId = req.user!.id;
    const status = (req.query.status as string) || "pending";

    const journalsRes = await pool.query(
      `SELECT journal_id FROM user_roles WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true`,
      [ceId],
    );
    const journalIds = journalsRes.rows.map((r: any) => r.journal_id);
    if (!journalIds.length) return res.json({ success: true, count: 0 });

    const result = await pool.query(
      `SELECT COUNT(*) FROM reviewer_applications WHERE journal_id = ANY($1::uuid[]) AND status = $2`,
      [journalIds, status],
    );
    res.json({ success: true, count: parseInt(result.rows[0].count, 10) });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const inviteApplication = async (req: AuthUser, res: Response) => {
  try {
    const ceId = req.user!.id;
    const { applicationId } = req.params;

    const appRes = await pool.query(
      `SELECT * FROM reviewer_applications WHERE id = $1`,
      [applicationId],
    );
    if (!appRes.rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });

    const app = appRes.rows[0];

    // Verify CE owns this journal
    const owns = await pool.query(
      `SELECT 1 FROM user_roles WHERE user_id = $1 AND journal_id = $2 AND role = 'chief_editor' AND is_active = true`,
      [ceId, app.journal_id],
    );
    if (!owns.rows.length)
      return res.status(403).json({ success: false, message: "Forbidden" });

    const ceRes = await pool.query(`SELECT username FROM users WHERE id = $1`, [
      ceId,
    ]);
    const ceName = ceRes.rows[0]?.username || "Chief Editor";

    // Send invitation via existing invitation service
    await sendInvitationService(
      { id: ceId, role: "chief_editor", username: ceName },
      {
        name: app.name,
        email: app.email,
        role: "reviewer",
        journal_id: app.journal_id,
      },
    );

    // Update application status
    await pool.query(
      `UPDATE reviewer_applications SET status = 'invited', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
      [ceId, applicationId],
    );

    res.json({ success: true, message: `Invitation sent to ${app.name}` });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const declineApplication = async (req: AuthUser, res: Response) => {
  try {
    const ceId = req.user!.id;
    const { applicationId } = req.params;

    const appRes = await pool.query(
      `SELECT ra.*, j.title AS journal_name FROM reviewer_applications ra JOIN journals j ON j.id = ra.journal_id WHERE ra.id = $1`,
      [applicationId],
    );
    if (!appRes.rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });

    const app = appRes.rows[0];

    const owns = await pool.query(
      `SELECT 1 FROM user_roles WHERE user_id = $1 AND journal_id = $2 AND role = 'chief_editor' AND is_active = true`,
      [ceId, app.journal_id],
    );
    if (!owns.rows.length)
      return res.status(403).json({ success: false, message: "Forbidden" });

    await pool.query(
      `UPDATE reviewer_applications SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
      [ceId, applicationId],
    );

    // Send polite rejection email
    sendRejectionEmailToApplicant(app.email, app.name, app.journal_name).catch(
      console.error,
    );

    res.json({
      success: true,
      message: `Application from ${app.name} declined`,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

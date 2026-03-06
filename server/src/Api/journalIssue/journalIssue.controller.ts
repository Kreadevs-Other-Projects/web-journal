import { Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  addJournalIssueService,
  getJournalIssuesService,
  JournalIssueData,
  updateJournalIssueService,
  deleteJournalIssueService,
} from "./journalIssue.service";

export const addJournalIssue = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");

    const journal_id = req.params.journalId;
    const data: JournalIssueData = req.body;

    const { issue } = await addJournalIssueService(req.user, journal_id, data);

    return res.status(201).json({
      success: true,
      message: "Journal issue created. Invoice sent to your email.",
      issue,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJournalIssues = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");

    const journal_id = req.params.journalId;
    const issues = await getJournalIssuesService(req.user, journal_id);

    return res.status(200).json({ success: true, issues });
  } catch (error: any) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

export const updateJournalIssue = async (req: AuthUser, res: Response) => {
  try {
    const issue = await updateJournalIssueService(
      req.user!,
      req.params.issueId,
      req.body,
    );

    res.json({ success: true, issue });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteJournalIssue = async (req: AuthUser, res: Response) => {
  try {
    await deleteJournalIssueService(req.user!, req.params.issueId);

    res.json({ success: true, message: "Issue deleted" });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};

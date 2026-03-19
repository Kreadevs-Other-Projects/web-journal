import { Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  addJournalIssueService,
  getJournalIssuesService,
  JournalIssueData,
  updateJournalIssueService,
  deleteJournalIssueService,
  requestNewIssueService,
  getMyIssuesService,
  getMyIssueRequestsService,
  getPendingIssueRequestsService,
  reviewIssueRequestService,
} from "./journalIssue.service";

export const addJournalIssue = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");

    const journal_id = req.params.journalId;
    const data: JournalIssueData = req.body;

    const { issue } = await addJournalIssueService(req.user, journal_id, data);

    return res.status(201).json({
      success: true,
      message: "Journal issue created successfully.",
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

export const requestNewIssue = async (req: AuthUser, res: Response) => {
  try {
    const request = await requestNewIssueService(req.user! as any, req.body);
    res.status(201).json({ success: true, request });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getMyIssues = async (req: AuthUser, res: Response) => {
  try {
    const issues = await getMyIssuesService(req.user!.id);
    res.json({ success: true, issues });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getMyIssueRequests = async (req: AuthUser, res: Response) => {
  try {
    const { journalId } = req.params;
    const requests = await getMyIssueRequestsService(journalId);
    res.json({ success: true, requests });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getPendingIssueRequests = async (req: AuthUser, res: Response) => {
  try {
    const requests = await getPendingIssueRequestsService(req.user!.id);
    res.json({ success: true, requests });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const reviewIssueRequest = async (req: AuthUser, res: Response) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
    const updated = await reviewIssueRequestService(req.user!, requestId, action);
    res.json({ success: true, request: updated });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

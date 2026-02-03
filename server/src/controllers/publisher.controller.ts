import { Request, Response } from "express";
import * as service from "../services/publisher.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const approveJournal = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming request to approveJournal");
    console.log("Request params:", req.params);

    const { journalId } = req.params;
    console.log("Extracted journalId:", journalId);

    const result = await service.approveJournalService(journalId);
    console.log("✅ Service result:", result);

    res.status(200).json({
      success: true,
      message: "Journal approved, chief editor activated, and invoice sent",
      data: result,
    });

    console.log("📤 Response sent successfully");
  } catch (err: any) {
    console.error("❌ Error in approveJournal:", err);

    res.status(400).json({
      success: false,
      message: err.message || "Failed to approve journal",
    });

    console.log("📤 Error response sent");
  }
};

export const getJournals = async (req: AuthUser, res: Response) => {
  const publisherId = req.user!.id;
  const journals = await service.fetchPublisherJournals(publisherId);
  res.json({ success: true, data: journals });
};

export const getIssues = async (req: Request, res: Response) => {
  const { journalId } = req.params;
  const issues = await service.fetchJournalIssues(journalId);
  res.json({ success: true, data: issues });
};

export const createIssue = async (req: Request, res: Response) => {
  const { journalId } = req.params;
  const issue = await service.addJournalIssue(journalId, req.body);
  res.json({ success: true, data: issue });
};

export const publishIssue = async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const updatedIssue = await service.setIssuePublished(issueId);
  res.json({ success: true, data: updatedIssue });
};

export const getPapers = async (req: Request, res: Response) => {
  const { journalId } = req.params;
  const papers = await service.fetchJournalPapers(journalId);
  res.json({ success: true, data: papers });
};

export const getPapersByIssueId = async (req: Request, res: Response) => {
  const { issueId } = req.params;

  const data = await service.getPapersByIssueIdService(issueId);

  res.status(200).json({
    success: true,
    message: "Papers fetched successfully",
    data,
  });
};

export const publishPaper = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const publisherId = req.user!.id;
  const published = await service.setPaperPublished(paperId, publisherId);
  res.json({ success: true, data: published });
};

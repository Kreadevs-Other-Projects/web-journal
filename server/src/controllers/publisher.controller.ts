import { Request, Response } from "express";
import * as service from "../services/publisher.service";
import { AuthUser } from "../middlewares/auth.middleware";

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

export const publishPaper = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const publisherId = req.user!.id;
  const published = await service.setPaperPublished(paperId, publisherId);
  res.json({ success: true, data: published });
};

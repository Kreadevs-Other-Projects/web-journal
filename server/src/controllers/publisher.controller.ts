import { Request, Response } from "express";
import * as service from "../services/publisher.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const approveJournal = async (req: Request, res: Response) => {
  try {
    const { journalId } = req.params;
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: "Issue ID is required",
      });
    }

    const result = await service.approveJournalService(journalId, issueId);

    res.status(200).json({
      success: true,
      message: "Journal issue approved successfully",
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || "Failed to approve journal",
    });
  }
};

export const getJournals = async (req: AuthUser, res: Response) => {
  const journals = await service.fetchPublisherJournals();
  res.json({ success: true, journals });
};

export const sendInvoice = async (req: AuthUser, res: Response) => {
  try {
    const user = req.user!;
    const { journalId, issueId, amount } = req.body;

    if (!journalId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "journalId and amount required" });
    }

    const payment = await service.journalPaymentInvoice(
      user,
      journalId,
      issueId,
      amount,
    );

    res.json({ success: true, data: payment });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
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

export const sendPaymentEmail = async (req: Request, res: Response) => {
  const {
    paperId,
    authorId,
    pages,
    pricePerPage,
    username,
    journalName,
    issueLabel,
    authorEmail,
    currency,
  } = req.body;

  if (
    !paperId ||
    !authorId ||
    !pages ||
    !pricePerPage ||
    !username ||
    !journalName ||
    !issueLabel ||
    !authorEmail
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const invoice = await service.sendPaperPaymentInvoice({
    paperId,
    authorId,
    pages,
    pricePerPage,
    currency,
    username,
    journalName,
    issueLabel,
    authorEmail,
  });

  res.status(200).json({
    success: true,
    message: "Payment email sent and record created",
    invoice,
  });
};

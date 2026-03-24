import { Request, Response } from "express";
import * as service from "./publisher.service";
import { AuthUser } from "../../middlewares/auth.middleware";

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
  const journals = await service.fetchPublisherJournals(req.user!.id);
  res.json({ success: true, journals });
};

export const replaceChiefEditor = async (req: AuthUser, res: Response) => {
  try {
    const { journalId } = req.params;
    const result = await service.replaceChiefEditorService(
      journalId,
      req.user!.id,
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res
      .status(400)
      .json({
        success: false,
        message: err.message || "Failed to replace chief editor",
      });
  }
};

export const sendInvoice = async (req: AuthUser, res: Response) => {
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
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
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
  try {
    const {
      paperId,
      authorId,
      pages,
      pricePerPage,
      username,
      journal_name,
      label,
      author_email,
      currency = "PKR",
      title,
    } = req.body;

    if (
      !paperId ||
      !authorId ||
      !pages ||
      !pricePerPage ||
      !username ||
      !journal_name ||
      !label ||
      !author_email
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
      journalName: journal_name,
      label,
      authorEmail: author_email,
      title,
    });

    return res.status(200).json({
      success: true,
      message: "Payment email sent and record created",
      invoice,
    });
  } catch (error: any) {
    console.error("Error in sendPaymentEmail controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const approvePaper = async (req: Request, res: Response) => {
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
  try {
    const { paymentId } = req.params;

    const approvedPayment = await service.approvePaperPaymentService(paymentId);

    res.status(200).json({
      success: true,
      message: "Paper payment approved successfully",
      data: approvedPayment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve payment",
    });
  }
};

export const getJournalPayments = async (req: Request, res: Response) => {
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
  try {
    const { journalId } = req.params;
    const payments = await service.fetchJournalPayments();

    res.json({
      success: true,
      data: payments,
    });
  } catch (err: any) {
    console.error("Fetch Payments Error:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to fetch payments",
    });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["success", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const result = await service.updatePaymentStatus(id, status);

    return res.json({
      success: true,
      message: `Payment ${status} successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error("updatePaymentStatus error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

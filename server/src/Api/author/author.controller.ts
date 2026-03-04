import { Request, Response } from "express";
import {
  getAuthorJournalsService,
  getAuthorJournalIssuesService,
} from "./author.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const getAuthorJournals = async (req: Request, res: Response) => {
  const journals = await getAuthorJournalsService();
  res.json({ success: true, journals });
};

export const getAuthorJournalIssues = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const journal_id = req.params.journalId;
    const issues = await getAuthorJournalIssuesService(journal_id);

    return res.status(200).json({ success: true, issues });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch journal issues";

    return res.status(400).json({ success: false, error: message });
  }
};

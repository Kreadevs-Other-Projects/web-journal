import { Request, Response } from "express";
import {
  getJournalsService,
  getJournalService,
  updateJournalService,
  deleteJournalService,
} from "../services/journal.service";

export const getJournals = async (req: Request, res: Response) => {
  const journals = await getJournalsService();

  return res.status(200).json({
    success: true,
    journals,
  });
};

export const getJournal = async (req: Request, res: Response) => {
  const journal = await getJournalService(req.params.id);

  return res.status(200).json({
    success: true,
    journal,
  });
};

export const updateJournal = async (req: Request, res: Response) => {
  const journal = await updateJournalService(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Journal has been updated successfully!",
    journal,
  });
};

export const deleteJournal = async (req: Request, res: Response) => {
  await deleteJournalService(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Journal has been deleted successfully!",
  });
};

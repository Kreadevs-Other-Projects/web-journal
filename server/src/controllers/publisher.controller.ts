import { Request, Response } from "express";
import {
  addJournalService,
  getPublisherJournalService,
} from "../services/publisher.service";

export const addJournal = async (req: Request, res: Response) => {
  await addJournalService(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Journal has been created successfully!",
  });
};

export const getPublisherJournal = async (req: Request, res: Response) => {
  const journals = await getPublisherJournalService(req.params.id);

  return res.status(200).json({
    success: true,
    journals,
  });
};

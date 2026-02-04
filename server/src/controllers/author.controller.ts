import { Request, Response } from "express";
import { getJournalsService } from "../services/author.service";

export const getAuthorJournals = async (req: Request, res: Response) => {
  try {
    const journals = await getJournalsService();
    res.json({ success: true, journals: journals });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

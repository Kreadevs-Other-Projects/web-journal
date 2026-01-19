import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  addJournalService,
  getOwnerJournalService,
} from "../services/publisher.service";

export const addJournal = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const journal = await addJournalService(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Journal created successfully",
      journal,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOwnerJournal = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const journals = await getOwnerJournalService(req.user);

    return res.status(200).json({
      success: true,
      journals,
    });
  } catch (error: any) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

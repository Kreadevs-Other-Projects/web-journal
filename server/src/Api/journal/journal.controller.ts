import { Request, Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  addJournalService,
  getOwnerJournalService,
  getJournalsService,
  getJournalService,
  updateJournalService,
  deleteJournalService,
  publisherCreateJournalService,
} from "./journal.service";

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

export const publisherCreateJournal = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const journal = await publisherCreateJournalService(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Journal created successfully",
      journal,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create journal",
    });
  }
};

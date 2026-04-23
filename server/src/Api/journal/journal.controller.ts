import { Request, Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import { uploadToSupabase } from "../../utils/uploadToSupabase";
import {
  addJournalService,
  getOwnerJournalService,
  getJournalsService,
  getJournalService,
  updateJournalService,
  deleteJournalService,
  publisherCreateJournalService,
  updateJournalLogoService,
  getEditorialBoardService,
  updateJournalAPCService,
  updatePublisherJournalService,
} from "./journal.service";
import { findJournalById } from "./journal.repository";

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

export const uploadJournalLogo = async (req: AuthUser, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    const uploaded = await uploadToSupabase(req.file.path, "journal-logos", req.file.originalname);
    await updateJournalLogoService(id, uploaded.url);
    res.json({ success: true, logo_url: uploaded.url });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getEditorialBoard = async (req: Request, res: Response) => {
  try {
    const board = await getEditorialBoardService(req.params.id);
    res.json({ success: true, ...board });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getAuthorGuidelines = async (req: Request, res: Response) => {
  try {
    const journal = await findJournalById(req.params.id);
    if (!journal)
      return res
        .status(404)
        .json({ success: false, message: "Journal not found" });
    res.json({ success: true, guidelines: journal.author_guidelines || "" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateJournalAPC = async (req: AuthUser, res: Response) => {
  try {
    const { journalId } = req.params;
    const { publication_fee, currency } = req.body;
    const fee = Number(publication_fee);
    if (isNaN(fee))
      return res
        .status(400)
        .json({ success: false, message: "Invalid fee value" });
    const updated = await updateJournalAPCService(
      journalId,
      req.user!.id,
      fee,
      currency,
    );
    return res.json({ success: true, journal: updated });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const updatePublisherJournal = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { journalId } = req.params;
    let logo_url: string | undefined;
    if (req.file) {
      const uploaded = await uploadToSupabase(req.file.path, "journal-logos", req.file.originalname);
      logo_url = uploaded.url;
    }

    const { doi: _doi, issn: _issn, ...rest } = req.body;
    const body = { ...rest };
    // Parse numeric fields
    if (body.publication_fee !== undefined) {
      const n = Number(body.publication_fee);
      body.publication_fee = isNaN(n) ? undefined : n;
    }

    const journal = await updatePublisherJournalService(
      journalId,
      req.user.id,
      { ...body, ...(logo_url ? { logo_url } : {}) },
    );

    return res.status(200).json({
      success: true,
      message: "Journal updated successfully",
      journal,
    });
  } catch (error: any) {
    if (error.field) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: [{ field: error.field, message: error.message }],
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update journal",
    });
  }
};

export const publisherCreateJournal = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let logo_url: string | null = null;
    if (req.file) {
      const uploaded = await uploadToSupabase(req.file.path, "journal-logos", req.file.originalname);
      logo_url = uploaded.url;
    }
    const journal = await publisherCreateJournalService(
      req.user.id,
      req.user.username,
      { ...req.body, logo_url },
    );

    return res.status(201).json({
      success: true,
      message: "Journal created successfully",
      journal,
    });
  } catch (error: any) {
    if (error.field) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: [{ field: error.field, message: error.message }],
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create journal",
    });
  }
};

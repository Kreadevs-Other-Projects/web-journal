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
  updateJournalLogoService,
  getEditorialBoardService,
  updateJournalAPCService,
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
  console.log("Journal logo_url:", journal?.logo_url);

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
    const logo_url = `uploads/${req.file.filename}`;
    await updateJournalLogoService(id, logo_url);
    res.json({ success: true, logo_url });
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

export const publisherCreateJournal = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const logo_url = req.file ? `uploads/${req.file.filename}` : null;
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

export const getIndexingStatus = async (req: Request, res: Response) => {
  try {
    const { journalId } = req.params;
    const { rows } = await (await import("../../configs/db")).pool.query(
      `SELECT indexing_notes, indexed_in FROM journals WHERE id = $1`,
      [journalId],
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Journal not found" });
    }
    res.json({
      success: true,
      indexing_notes: rows[0].indexing_notes || null,
      indexed_in: rows[0].indexed_in || [],
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateIndexingStatus = async (req: AuthUser, res: Response) => {
  try {
    const { journalId } = req.params;
    const { indexing_notes, indexed_in } = req.body;
    const { rows } = await (await import("../../configs/db")).pool.query(
      `UPDATE journals
       SET indexing_notes = $1, indexed_in = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING indexing_notes, indexed_in`,
      [indexing_notes || null, indexed_in || [], journalId],
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Journal not found" });
    }
    res.json({ success: true, ...rows[0] });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

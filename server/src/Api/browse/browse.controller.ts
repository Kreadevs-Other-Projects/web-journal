import { Request, Response } from "express";
import { getBrowseDataService, getPublicPaperService, getPublicPaperHtmlService } from "./browse.service";
import { getPublicJournalsRepo, getLatestPublishedPapersRepo, getOpenJournalsRepo } from "./browse.repository";

export const getPublicPaper = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const paper = await getPublicPaperService(paperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }
    res.json({ success: true, paper });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch paper" });
  }
};

export const getPaperHtml = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const html = await getPublicPaperHtmlService(paperId);
    console.log("html content length:", html?.length ?? 0, "paperId:", paperId);
    res.json({ success: true, html: html || null });
  } catch {
    res.status(500).json({ success: false, message: "Failed to get paper HTML" });
  }
};

export const getHomeJournals = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const q = req.query.q as string | undefined;
    const type = req.query.type as string | undefined;
    const open = req.query.open === "true";
    const category_id = req.query.category_id as string | undefined;
    const journals = await getPublicJournalsRepo({ limit, q, type, open: open || undefined, category_id });
    res.json({ success: true, journals });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch journals" });
  }
};

export const getOpenJournals = async (_req: Request, res: Response) => {
  try {
    const journals = await getOpenJournalsRepo();
    res.json({ success: true, journals });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch open journals" });
  }
};

export const getHomePublications = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const offset = Number(req.query.offset) || 0;
    const q = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const papers = await getLatestPublishedPapersRepo({ limit, offset, q, category, year });
    res.json({ success: true, papers });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch publications" });
  }
};

export const getBrowseData = async (req: Request, res: Response) => {
  try {
    const { q, year, journalId } = req.query;

    const data = await getBrowseDataService({
      search: q,
      year,
      journalId,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch browse data",
    });
  }
};

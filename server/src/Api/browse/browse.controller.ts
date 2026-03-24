import { Request, Response } from "express";
import { getBrowseDataService, getPublicPaperService, getPublicPaperHtmlService } from "./browse.service";
import { getPublicJournalsRepo, getLatestPublishedPapersRepo } from "./browse.repository";

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
    const journals = await getPublicJournalsRepo(limit);
    res.json({ success: true, journals });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch journals" });
  }
};

export const getHomePublications = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const papers = await getLatestPublishedPapersRepo(limit);
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

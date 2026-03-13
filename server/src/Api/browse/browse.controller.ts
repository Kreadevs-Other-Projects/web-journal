import { Request, Response } from "express";
import { getBrowseDataService, getPublicPaperService } from "./browse.service";

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

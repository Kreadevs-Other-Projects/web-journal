import { Request, Response } from "express";
import {
  createPaperService,
  getAllPapersService,
  updatePaperStatusService,
  getPapersByAuthorService,
  getKeywordSuggestionsService,
  assignPaperToIssueService,
  getPaperVersionsService,
} from "./paper.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const createPaper = async (req: AuthUser, res: Response) => {
  const body = req.body;

  // Multipart fields arrive as strings; parse arrays/objects
  const parse = (field: any, fallback: any = []) => {
    if (!field) return fallback;
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch {
        return fallback;
      }
    }
    return field;
  };

  const manuscript_url = req.file
    ? `/uploads/${req.file.filename}`
    : undefined;

  const data = {
    title: body.title,
    abstract: body.abstract || "",
    category: body.category,
    keywords: parse(body.keywords),
    journal_id: body.journal_id,
    issue_id: body.issue_id,
    author_id: req.user!.id,
    author_names: parse(body.author_names),
    corresponding_authors: parse(body.corresponding_authors),
    paper_references: parse(body.paper_references),
    manuscript_url,
    manuscript_size: req.file?.size,
    manuscript_type: req.file?.mimetype,
  };

  const paper = await createPaperService(
    data,
    req.user!.email,
    req.user!.username,
  );

  res.status(201).json({ success: true, data: paper });
};

export const getKeywordSuggestions = async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ success: true, keywords: [] });
  const keywords = await getKeywordSuggestionsService(q);
  res.json({ success: true, keywords });
};

export const getAllPapers = async (req: AuthUser, res: Response) => {
  const papers = await getAllPapersService();
  res.json({ success: true, papers });
};

export const getPapersByAuthor = async (req: any, res: Response) => {
  const papers = await getPapersByAuthorService(req.user.id);
  res.json({ success: true, papers });
};

export const assignPaperToIssue = async (req: AuthUser, res: Response) => {
  try {
    const { issue_id } = req.body;
    const { paperId } = req.params;
    if (!issue_id)
      return res
        .status(400)
        .json({ success: false, message: "issue_id is required" });

    const paper = await assignPaperToIssueService(req.user!, paperId, issue_id);
    res.json({ success: true, paper });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getPaperVersionsList = async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const versions = await getPaperVersionsService(paperId);
  res.json({ success: true, versions });
};

export const updatePaperStatus = async (req: any, res: Response) => {
  try {
    const paper = await updatePaperStatusService(
      req.user,
      req.params.paperId,
      req.body.status,
    );
    res.json({ success: true, paper });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};

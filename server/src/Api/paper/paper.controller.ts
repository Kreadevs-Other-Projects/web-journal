import fs from "fs";
import { Request, Response } from "express";
import {
  createPaperService,
  getAllPapersService,
  updatePaperStatusService,
  getPapersByAuthorService,
  getKeywordSuggestionsService,
  assignPaperToIssueService,
  getPaperVersionsService,
  extractMetadataService,
  getPaperTrackingService,
  getPaperMetadataCheckService,
  editPaperMetadataService,
  getPublicKeywordSuggestionsService,
  getJournalTopKeywordsService,
} from "./paper.service";
import { getStatusLogRepo } from "./paper.repository";
import { uploadPaperVersionService } from "../paperVersion/paperVersion.service";
import {
  getPublicPaperHtmlService,
  getPaperVersionHtmlService,
} from "../browse/browse.service";
import { AuthUser } from "../../middlewares/auth.middleware";
import { uploadToSupabase } from "../../utils/uploadToSupabase";

export const createPaper = async (req: AuthUser, res: Response) => {
  const body = req.body;

  if (body.policies_accepted !== "true") {
    return res.status(400).json({
      success: false,
      message: "You must accept all journal policies before submitting.",
    });
  }

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

  let manuscript_url: string | undefined;
  let manuscript_html: string | undefined;

  if (req.file) {
    const localPath = req.file.path;
    const lowerName = req.file.originalname.toLowerCase();

    try {
      if (lowerName.endsWith(".docx")) {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ path: localPath });
        if (result.value) manuscript_html = result.value;
      } else if (lowerName.endsWith(".tex") || lowerName.endsWith(".latex")) {
        const { extractLatexToHtml } =
          await import("../../utils/latexToHtml.js");
        const html = extractLatexToHtml(localPath);
        if (html && html.length > 50) manuscript_html = html;
      }
    } catch {}

    const uploaded = await uploadToSupabase(
      localPath,
      "manuscripts",
      req.file.originalname,
    );
    manuscript_url = uploaded.url;
  }

  const authorDetails = parse(body.author_details);
  const firstAuthor = authorDetails?.[0];
  if (!firstAuthor?.name?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "First author name is required." });
  }
  if (!firstAuthor?.email?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "First author email is required." });
  }
  if (!firstAuthor?.affiliation?.trim()) {
    return res
      .status(400)
      .json({
        success: false,
        message: "First author affiliation/institution is required.",
      });
  }

  const data = {
    title: body.title,
    abstract: body.abstract || "",
    category: body.category,
    article_type: body.article_type,
    keywords: parse(body.keywords),
    journal_id: body.journal_id,
    issue_id: body.issue_id,
    author_id: req.user!.id,
    author_names: parse(body.author_names),
    corresponding_authors: parse(body.corresponding_authors),
    author_details: authorDetails,
    corresponding_author_details: parse(body.corresponding_author_details),
    paper_references: parse(body.paper_references),
    manuscript_url,
    manuscript_html,
    manuscript_size: req.file?.size,
    manuscript_type: req.file?.mimetype,
    conflict_of_interest: body.conflict_of_interest,
    funding_info: body.funding_info,
    data_availability: body.data_availability,
    ethical_approval: body.ethical_approval,
    author_contributions: body.author_contributions,
    policies_accepted: true,
    policies_accepted_at: new Date(),
    is_special_issue: body.is_special_issue === "true",
    previously_submitted: body.previously_submitted || "no",
    preprint_available: body.preprint_available === "true",
    human_subjects: body.human_subjects === "true",
    other_journal_submission: body.other_journal_submission || "no",
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

export const getPublicKeywordSuggestionsController = async (
  req: Request,
  res: Response,
) => {
  const q = String(req.query.q || "").trim() || null;
  const journalId = String(req.query.journal_id || "").trim() || null;
  const limit = Math.min(Number(req.query.limit) || 10, 30);
  const keywords = await getPublicKeywordSuggestionsService(
    q,
    journalId,
    limit,
  );
  res.json({ success: true, keywords });
};

export const getJournalTopKeywordsController = async (
  req: Request,
  res: Response,
) => {
  const { journalId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const keywords = await getJournalTopKeywordsService(journalId, limit);
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

export const extractMetadata = async (req: AuthUser, res: Response) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "";
  if (!["docx", "pdf", "tex", "latex"].includes(ext)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({
      success: false,
      message:
        "Only .docx, .pdf, and .tex/.latex files support metadata extraction",
    });
  }
  try {
    const metadata = await extractMetadataService(req.file.path, ext);
    fs.unlink(req.file.path, () => {});
    res.json({ success: true, ...metadata });
  } catch {
    fs.unlink(req.file.path, () => {});
    res
      .status(500)
      .json({ success: false, message: "Failed to extract metadata" });
  }
};

export const getPaperTrackingController = async (
  req: AuthUser,
  res: Response,
) => {
  const { paperId } = req.params;
  try {
    const data = await getPaperTrackingService(paperId, req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(404).json({ success: false, message: e.message });
  }
};

export const getPaperHtmlController = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  try {
    const html = await getPublicPaperHtmlService(paperId);
    res.json({ success: true, html: html || null });
  } catch (err) {
    console.error("getPaperHtmlController error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get paper HTML" });
  }
};

export const getPaperVersionHtmlController = async (
  req: AuthUser,
  res: Response,
) => {
  const { paperId, versionId } = req.params;
  try {
    const html = await getPaperVersionHtmlService(paperId, versionId);
    res.json({ success: true, html: html || null });
  } catch (err) {
    console.error("getPaperVersionHtmlController error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get version HTML" });
  }
};

export const uploadRevisionController = async (
  req: AuthUser,
  res: Response,
) => {
  const { paperId } = req.params;
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Manuscript file is required." });
  }
  try {
    const versionNumber = parseInt(req.body.version_number, 10) || 2;
    const uploaded = await uploadToSupabase(
      req.file.path,
      "manuscripts",
      req.file.originalname,
    );
    const version = await uploadPaperVersionService(req.user, paperId, {
      version_label: `v${versionNumber}`,
      file_url: uploaded.url,
      file_size: req.file.size,
      file_type: req.file.mimetype,
    });
    return res.status(201).json({ success: true, version });
  } catch (err: any) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return res
      .status(400)
      .json({ success: false, message: err.message || "Upload failed." });
  }
};

export const getMetadataCheck = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  try {
    const result = await getPaperMetadataCheckService(paperId);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(404).json({ success: false, message: e.message });
  }
};

export const getStatusLogController = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const log = await getStatusLogRepo(paperId);
  return res.status(200).json({ success: true, log });
};

export const editPaperMetadataController = async (
  req: AuthUser,
  res: Response,
) => {
  const { paperId } = req.params;
  const { title, abstract } = req.body;
  try {
    const paper = await editPaperMetadataService(
      paperId,
      req.user!.id,
      req.user!.role,
      title,
      abstract,
    );
    return res.json({ success: true, paper });
  } catch (err: any) {
    return res
      .status(err.status || 400)
      .json({ success: false, message: err.message });
  }
};

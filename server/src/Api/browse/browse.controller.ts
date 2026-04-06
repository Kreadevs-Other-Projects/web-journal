import { Request, Response } from "express";
import { getBrowseDataService, getPublicPaperService, getPublicPaperHtmlService } from "./browse.service";
import {
  getPublicJournalsRepo,
  getLatestPublishedPapersRepo,
  getOpenJournalsRepo,
  getPublicPaperBySlugRepo,
  getPaperSlugRepo,
  getPublicPaperRepo,
} from "./browse.repository";

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

export const getPublicPaperBySlug = async (req: Request, res: Response) => {
  try {
    const { acronym, slug } = req.params;
    const paper = await getPublicPaperBySlugRepo(acronym, slug);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }
    res.json({ success: true, paper });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch article" });
  }
};

export const getPaperSlug = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const row = await getPaperSlugRepo(paperId);
    if (!row) {
      return res.status(404).json({ success: false, message: "Paper not found or not published" });
    }
    res.json({ success: true, acronym: row.acronym, url_slug: row.url_slug });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch paper slug" });
  }
};

export const getPaperXml = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const paper = await getPublicPaperRepo(paperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }

    const authors = Array.isArray(paper.author_details)
      ? paper.author_details
      : typeof paper.author_details === "string"
      ? JSON.parse(paper.author_details || "[]")
      : [];

    const authorNames: string[] = authors.length
      ? authors.map((a: any) => a.name || "")
      : Array.isArray(paper.author_names)
      ? paper.author_names
      : [];

    const authorsXml = authorNames
      .map((name: string, i: number) => {
        const parts = name.trim().split(" ");
        const given = parts.slice(0, -1).join(" ");
        const family = parts.slice(-1)[0] || "";
        const seq = i === 0 ? "first" : "additional";
        return `    <contrib contrib-type="author" seq="${seq}">
      <name>
        <surname>${family}</surname>
        <given-names>${given}</given-names>
      </name>
    </contrib>`;
      })
      .join("\n");

    const keywords: string[] = Array.isArray(paper.keywords)
      ? paper.keywords
      : typeof paper.keywords === "string"
      ? JSON.parse(paper.keywords || "[]")
      : [];

    const keywordsXml = keywords.length
      ? `  <kwd-group kwd-group-type="author-keywords">
${keywords.map((k: string) => `    <kwd>${k}</kwd>`).join("\n")}
  </kwd-group>`
      : "";

    const year = paper.year || new Date().getFullYear();
    const volume = paper.volume || "";
    const issue = paper.issue || "";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Article Tag Suite 1.2//EN"
  "https://jats.nlm.nih.gov/publishing/1.2/JATS-journalpublishing1.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="research-article">
  <front>
    <journal-meta>
      <journal-title-group>
        <journal-title>${paper.journal_title || ""}</journal-title>
        <abbrev-journal-title>${paper.acronym || ""}</abbrev-journal-title>
      </journal-title-group>
      ${paper.issn ? `<issn pub-type="epub">${paper.issn}</issn>` : ""}
    </journal-meta>
    <article-meta>
      <article-id pub-id-type="doi">${paper.doi || ""}</article-id>
      <title-group>
        <article-title>${paper.title || ""}</article-title>
      </title-group>
      <contrib-group>
${authorsXml}
      </contrib-group>
      <pub-date pub-type="epub">
        <year>${year}</year>
      </pub-date>
      ${volume ? `<volume>${volume}</volume>` : ""}
      ${issue ? `<issue>${issue}</issue>` : ""}
      <abstract>
        <p>${paper.abstract || ""}</p>
      </abstract>
${keywordsXml}
    </article-meta>
  </front>
</article>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="article-${paperId}.xml"`,
    );
    return res.send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate XML" });
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

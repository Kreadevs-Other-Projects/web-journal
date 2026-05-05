import path from "path";
import {
  getBrowseDataRepo,
  getPublicPaperRepo,
  getPaperVersionForHtmlRepo,
  getVersionForHtmlByIdRepo,
  cacheVersionHtmlRepo,
} from "./browse.repository";
import { downloadToBuffer } from "../../utils/uploadToSupabase";
import { convertLatexToHtml } from "../../utils/latexToHtml";

export const getBrowseDataService = async (filters: any) => {
  const rows = await getBrowseDataRepo(filters);

  const grouped: Record<string, any> = {};

  rows.forEach((row) => {
    const journalKey = row.journal_id;

    if (!grouped[journalKey]) {
      grouped[journalKey] = {
        journal_id: row.journal_id,
        journal_title: row.journal_title,
        issn: row.issn,
        aims_and_scope: row.aims_and_scope,
        logo_url: row.logo_url,
        journal_category_id: row.journal_category_id,
        category_name: row.category_name,
        category_slug: row.category_slug,
        published_at: row.published_at || row.journal_created_at,
        issues: {},
        papers: [],
      };
    }

    const journal = grouped[journalKey];

    if (row.issue_id) {
      if (!journal.issues[row.issue_id]) {
        journal.issues[row.issue_id] = {
          issue_id: row.issue_id,
          label: `Vol ${row.volume} Issue ${row.issue} (${row.year})`,
          published_at: row.published_at,
          papers: [],
        };
      }

      if (row.paper_id) {
        journal.issues[row.issue_id].papers.push({
          id: row.paper_id,
          title: row.paper_title,
          abstract: row.abstract,
          pdf_url: row.file_url,
        });
      }
    }
  });

  return Object.values(grouped).map((journal) => {
    const issueList = Object.values(journal.issues) as any[];
    issueList.sort(
      (a, b) => b.published_at?.localeCompare(a.published_at ?? "") ?? 0,
    );

    const allPapers = issueList.flatMap((i: any) => i.papers);
    const latestIssue = issueList[0];

    return {
      journal_id: journal.journal_id,
      journal_title: journal.journal_title,
      issn: journal.issn,
      aims_and_scope: journal.aims_and_scope,
      logo_url: journal.logo_url,
      journal_category_id: journal.journal_category_id,
      category_name: journal.category_name,
      category_slug: journal.category_slug,
      issue: latestIssue ? latestIssue.label : "No issues published yet",
      published_at: latestIssue?.published_at ?? journal.published_at,
      issues: issueList,
      papers: allPapers,
    };
  });
};

export const getPublicPaperService = async (paperId: string) => {
  return getPublicPaperRepo(paperId);
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pdfTextToHtml(rawText: string): string {
  if (!rawText || rawText.trim().length < 50) {
    return "<p>Text content could not be extracted from this PDF. Please download the file to view it.</p>";
  }

  const cleaned = rawText
    .replace(/\f/g, "\n\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  let html = "";

  for (const line of lines) {
    const wordCount = line.split(" ").length;
    const isAllCaps =
      line === line.toUpperCase() && /[A-Z]/.test(line) && line.length > 3;
    const isShortLine = wordCount <= 8 && line.length < 80;
    const endsWithColon = line.endsWith(":");
    const startsWithNumber = /^\d+[\.\s]+[A-Z]/.test(line);
    const isCommonSection =
      /^(abstract|introduction|conclusion|discussion|methods?|results?|references?|background|related work|acknowledgements?|keywords?)/i.test(
        line,
      );
    const isLikelyHeading =
      isShortLine && (isAllCaps || endsWithColon || isCommonSection);

    if (isLikelyHeading || (startsWithNumber && isShortLine)) {
      if (isCommonSection || (isAllCaps && line.length < 50)) {
        html += `<h2>${escapeHtml(line)}</h2>\n`;
      } else {
        html += `<h3>${escapeHtml(line)}</h3>\n`;
      }
    } else {
      html += `<p>${escapeHtml(line)}</p>\n`;
    }
  }

  html = html
    .replace(/<\/p>\n<p>(?=[a-z,;])/g, " ")
    .replace(/<p>\s*<\/p>\n?/g, "");

  return html || "<p>Text content could not be extracted from this PDF.</p>";
}

async function convertVersionToHtml(version: {
  id: string;
  file_url: string | null;
  html_content: string | null;
}): Promise<string | null> {
  if (version.html_content && version.html_content.length > 100) {
    return version.html_content;
  }
  if (!version.file_url) return null;

  const fileUrl = version.file_url;
  const ext = fileUrl.startsWith("http")
    ? path.extname(new URL(fileUrl).pathname).split("?")[0].toLowerCase()
    : path.extname(fileUrl).toLowerCase();

  let html: string | null = null;

  try {
    if (fileUrl.startsWith("http")) {
      // Supabase/CDN — download to Buffer (no disk writes)
      const { buffer } = await downloadToBuffer(fileUrl);

      if (ext === ".docx") {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ buffer });
        if (result.value) html = result.value;
      } else if (ext === ".pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        html = pdfTextToHtml(data.text);
      } else if (ext === ".tex" || ext === ".latex") {
        html = convertLatexToHtml(buffer.toString("utf-8"));
      }
    } else {
      // Legacy local path — dev-only fallback
      const filename = path.basename(fileUrl);
      const localPath = path.resolve(process.cwd(), "uploads", filename);
      const fsPromises = await import("fs/promises");
      const buffer = await fsPromises.readFile(localPath);

      if (ext === ".docx") {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ buffer });
        if (result.value) html = result.value;
      } else if (ext === ".pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        html = pdfTextToHtml(data.text);
      } else if (ext === ".tex" || ext === ".latex") {
        html = convertLatexToHtml(buffer.toString("utf-8"));
      }
    }
  } catch (err: any) {
    console.error("[html] conversion failed:", err.message);
  }

  if (html && html.length > 50) {
    await cacheVersionHtmlRepo(version.id, html);
  }

  return html;
}

export const getPublicPaperHtmlService = async (
  paperId: string,
): Promise<string | null> => {
  const version = await getPaperVersionForHtmlRepo(paperId);
  if (!version) return null;
  return convertVersionToHtml(version);
};

export const getPaperVersionHtmlService = async (
  paperId: string,
  versionId: string,
): Promise<string | null> => {
  const version = await getVersionForHtmlByIdRepo(paperId, versionId);
  if (!version) return null;
  return convertVersionToHtml(version);
};

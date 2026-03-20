import path from "path";
import { getBrowseDataRepo, getPublicPaperRepo, getPaperVersionForHtmlRepo, cacheVersionHtmlRepo } from "./browse.repository";

export const getBrowseDataService = async (filters: any) => {
  const rows = await getBrowseDataRepo(filters);

  const grouped: any = {};

  rows.forEach((row) => {
    // Group by issue if present, otherwise by journal (for journals with no issues yet)
    const issueKey = row.issue_id || `journal-${row.journal_id}`;

    if (!grouped[issueKey]) {
      grouped[issueKey] = {
        journal_id: row.journal_id,
        journal_title: row.journal_title,
        issn: row.issn,
        aims_and_scope: row.aims_and_scope,
        logo_url: row.logo_url,
        issue: row.issue_id
          ? `Vol ${row.volume} Issue ${row.issue} (${row.year})`
          : "No issues published yet",
        published_at: row.published_at,
        papers: [],
      };
    }

    // Only push if there's an actual paper (LEFT JOIN can produce null paper rows)
    if (row.paper_id) {
      grouped[issueKey].papers.push({
        id: row.paper_id,
        title: row.paper_title,
        abstract: row.abstract,
        pdf_url: row.file_url,
      });
    }
  });

  return Object.values(grouped);
};

export const getPublicPaperService = async (paperId: string) => {
  return getPublicPaperRepo(paperId);
};

function pdfTextToHtml(rawText: string): string {
  // Normalise line endings, collapse 3+ blank lines to 2
  const normalised = rawText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const blocks = normalised.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  const parts: string[] = [];
  for (const block of blocks) {
    // Single line, short, ALL-CAPS → heading
    const lines = block.split("\n");
    const singleLine = lines.length === 1;
    const isAllCaps = singleLine && block === block.toUpperCase() && /[A-Z]/.test(block) && block.length < 120;
    const isNumberedSection = singleLine && /^\d+[\.\s]+[A-Z]/.test(block) && block.length < 120;

    if (isAllCaps || isNumberedSection) {
      parts.push(`<h2>${escapeHtml(block)}</h2>`);
    } else {
      // Join wrapped lines within a paragraph back into one string
      const text = block.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();
      if (text) parts.push(`<p>${escapeHtml(text)}</p>`);
    }
  }
  return parts.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const getPublicPaperHtmlService = async (paperId: string): Promise<string | null> => {
  const version = await getPaperVersionForHtmlRepo(paperId);
  if (!version) return null;

  // Return cached HTML if available
  if (version.html_content) return version.html_content;

  if (!version.file_url) return null;

  const filename = path.basename(version.file_url);
  // Use __dirname-relative path so it works regardless of cwd at startup
  const filePath = path.resolve(__dirname, "../../../uploads", filename);
  const lowerUrl = version.file_url.toLowerCase();

  // .docx → mammoth
  if (lowerUrl.endsWith(".docx")) {
    try {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ path: filePath });
      console.log("mammoth result length:", result.value.length, "filePath:", filePath);
      if (result.value) {
        await cacheVersionHtmlRepo(version.id, result.value);
        return result.value;
      }
    } catch (err) {
      console.error("mammoth conversion failed:", err);
    }
    return null;
  }

  // .pdf → pdf-parse → plain HTML paragraphs
  if (lowerUrl.endsWith(".pdf")) {
    try {
      const fs = await import("fs/promises");
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      console.log("pdf-parse text length:", data.text.length, "filePath:", filePath);

      const html = pdfTextToHtml(data.text);
      if (html) {
        await cacheVersionHtmlRepo(version.id, html);
        return html;
      }
    } catch (err) {
      console.error("pdf-parse conversion failed:", err);
    }
    return null;
  }

  return null;
};

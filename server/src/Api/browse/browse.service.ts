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
        published_at: row.journal_created_at,
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
  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  let html = "";

  for (const line of lines) {
    const wordCount = line.split(" ").length;
    const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line) && line.length > 3;
    const isShortLine = wordCount <= 8 && line.length < 80;
    const endsWithColon = line.endsWith(":");
    const startsWithNumber = /^\d+[\.\s]+[A-Z]/.test(line);
    const isCommonSection = /^(abstract|introduction|conclusion|discussion|methods|results|references|background|related work|acknowledgements?|keywords?)/i.test(line);
    const isLikelyHeading = isShortLine && (isAllCaps || endsWithColon || isCommonSection);

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

  // Merge consecutive short <p> lines that are likely wrapped sentence continuations
  html = html.replace(/<\/p>\n<p>(?=[a-z,;])/g, " ").replace(/<p>\s*<\/p>\n?/g, "");

  return html || "<p>Text content could not be extracted from this PDF.</p>";
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
  if (!version) {
    console.log("getPublicPaperHtmlService: no version found for paperId", paperId);
    return null;
  }

  // Return cached HTML if available
  if (version.html_content) return version.html_content;

  if (!version.file_url) {
    console.log("getPublicPaperHtmlService: version has no file_url");
    return null;
  }

  const filename = path.basename(version.file_url);
  const filePath = path.resolve(__dirname, "../../../uploads", filename);
  const lowerUrl = version.file_url.toLowerCase();

  console.log("Looking for file at:", filePath);
  const fsSync = await import("fs");
  console.log("File exists:", fsSync.default.existsSync(filePath));

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

  // .pdf → pdf-parse → structured HTML
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

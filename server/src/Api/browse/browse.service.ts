import path from "path";
import {
  getBrowseDataRepo,
  getPublicPaperRepo,
  getPaperVersionForHtmlRepo,
  cacheVersionHtmlRepo,
} from "./browse.repository";

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
  if (!rawText || rawText.trim().length < 50) {
    return "<p>Text content could not be extracted from this PDF. Please download the file to view it.</p>";
  }

  // Clean up PDF artifacts before splitting
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

  // Merge consecutive short <p> lines that are likely wrapped sentence continuations
  html = html
    .replace(/<\/p>\n<p>(?=[a-z,;])/g, " ")
    .replace(/<p>\s*<\/p>\n?/g, "");

  return html || "<p>Text content could not be extracted from this PDF.</p>";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const getPublicPaperHtmlService = async (
  paperId: string,
): Promise<string | null> => {
  const version = await getPaperVersionForHtmlRepo(paperId);
  if (!version) {
    console.log(`[html] No version found for paper ${paperId}`);
    return null;
  }

  // Return cached HTML if available
  if (version.html_content) {
    console.log(`[html] Returning cached HTML (${version.html_content.length} chars) for paper ${paperId}`);
    return version.html_content;
  }

  if (!version.file_url) {
    console.log(`[html] No file_url for paper ${paperId}`);
    return null;
  }

  const filename = path.basename(version.file_url);
  const primaryPath = path.resolve(__dirname, "../../../uploads", filename);
  const lowerUrl = version.file_url.toLowerCase();

  console.log(`[html] file_url: ${version.file_url}`);
  console.log(`[html] filename: ${filename}`);
  console.log(`[html] primary path: ${primaryPath}`);

  const fsSync = (await import("fs")).default;

  // Resolve actual file path — try primary then fallbacks
  const altPaths = [
    primaryPath,
    path.join(process.cwd(), "uploads", filename),
    path.join(process.cwd(), "src", "uploads", filename),
    path.join(__dirname, "../../uploads", filename),
    path.join(__dirname, "../../../../../uploads", filename),
  ];

  let resolvedPath: string | null = null;
  for (const candidate of altPaths) {
    if (fsSync.existsSync(candidate)) {
      resolvedPath = candidate;
      console.log(`[html] Found file at: ${resolvedPath}`);
      break;
    }
  }

  if (!resolvedPath) {
    console.log(`[html] File not found on disk. Tried: ${altPaths.join(", ")}`);
    return null;
  }

  // .docx → mammoth
  if (lowerUrl.endsWith(".docx")) {
    try {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ path: resolvedPath });
      if (result.value) {
        await cacheVersionHtmlRepo(version.id, result.value);
        return result.value;
      }
      console.log(`[html] mammoth returned empty value`);
    } catch (err) {
      console.error("[html] mammoth conversion failed:", err);
    }
    return null;
  }

  // .pdf → pdf-parse → structured HTML
  if (lowerUrl.endsWith(".pdf")) {
    try {
      const fs = await import("fs/promises");
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = await fs.readFile(resolvedPath);
      const data = await pdfParse(buffer);
      console.log(`[html] pdf-parse extracted ${data.text?.length ?? 0} chars`);

      const html = pdfTextToHtml(data.text);
      if (html) {
        await cacheVersionHtmlRepo(version.id, html);
        return html;
      }
    } catch (err) {
      console.error("[html] pdf-parse conversion failed:", err);
    }
    return null;
  }

  return null;
};

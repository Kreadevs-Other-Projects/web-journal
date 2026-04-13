import path from "path";
import {
  getBrowseDataRepo,
  getPublicPaperRepo,
  getPaperVersionForHtmlRepo,
  getVersionForHtmlByIdRepo,
  cacheVersionHtmlRepo,
} from "./browse.repository";

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

  // Flatten for the frontend — show latest issue label, aggregate all papers
  return Object.values(grouped).map((journal) => {
    const issueList = Object.values(journal.issues) as any[];

    // Sort issues descending (latest first)
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
      issues: issueList, // full list available if needed
      papers: allPapers,
    };
  });
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

async function convertVersionToHtml(version: {
  id: string;
  file_url: string | null;
  html_content: string | null;
}): Promise<string | null> {
  if (version.html_content) return version.html_content;
  if (!version.file_url) return null;

  const filename = path.basename(version.file_url);
  const primaryPath = path.resolve(__dirname, "../../../uploads", filename);
  const lowerUrl = version.file_url.toLowerCase();

  const fsSync = (await import("fs")).default;
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
}

export const getPublicPaperHtmlService = async (
  paperId: string,
): Promise<string | null> => {
  const version = await getPaperVersionForHtmlRepo(paperId);
  if (!version) {
    console.log(`[html] No version found for paper ${paperId}`);
    return null;
  }
  return convertVersionToHtml(version);
};

export const getPaperVersionHtmlService = async (
  paperId: string,
  versionId: string,
): Promise<string | null> => {
  const version = await getVersionForHtmlByIdRepo(paperId, versionId);
  if (!version) {
    console.log(`[html] Version ${versionId} not found for paper ${paperId}`);
    return null;
  }
  return convertVersionToHtml(version);
};

import path from "path";
import https from "https";
import http from "http";
import os from "os";
import fs from "fs";
import {
  getBrowseDataRepo,
  getPublicPaperRepo,
  getPaperVersionForHtmlRepo,
  getVersionForHtmlByIdRepo,
  cacheVersionHtmlRepo,
} from "./browse.repository";
import { extractLatexToHtml } from "../../utils/latexToHtml";

async function downloadToTemp(url: string): Promise<string> {
  const ext =
    path.extname(new URL(url).pathname).split("?")[0].toLowerCase() || ".tmp";
  const tempPath = path.join(
    os.tmpdir(),
    `paper-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`,
  );
  const protocol = url.startsWith("https") ? https : http;
  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(tempPath);
    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          fs.unlink(tempPath, () => {});
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
        file.on("error", (err) => {
          fs.unlink(tempPath, () => {});
          reject(err);
        });
      })
      .on("error", (err) => {
        fs.unlink(tempPath, () => {});
        reject(err);
      });
  });
  return tempPath;
}

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

async function resolveFilePath(
  fileUrl: string,
): Promise<{ filePath: string; isTemp: boolean }> {
  // Remote URL (Supabase etc) — download to temp
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    console.log("[html] downloading from remote:", fileUrl);
    const tempPath = await downloadToTemp(fileUrl);
    console.log("[html] downloaded to temp:", tempPath);
    return { filePath: tempPath, isTemp: true };
  }

  // Local path fallback
  const filename = path.basename(fileUrl);
  const candidates = [
    path.resolve(__dirname, "../../../uploads", filename),
    path.join(process.cwd(), "uploads", filename),
    path.join(process.cwd(), "src", "uploads", filename),
    path.join(__dirname, "../../uploads", filename),
    path.join(__dirname, "../../../../../uploads", filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { filePath: candidate, isTemp: false };
    }
  }
  throw new Error(`File not found locally: ${fileUrl}`);
}

async function convertVersionToHtml(version: {
  id: string;
  file_url: string | null;
  html_content: string | null;
}): Promise<string | null> {
  if (version.html_content) return version.html_content;
  if (!version.file_url) return null;

  let filePath: string;
  let isTemp = false;

  try {
    const resolved = await resolveFilePath(version.file_url);
    filePath = resolved.filePath;
    isTemp = resolved.isTemp;
  } catch (err: any) {
    console.error("[html] could not resolve file:", err.message);
    return null;
  }

  // Determine extension from temp path (reliable) or original URL
  const ext =
    path.extname(filePath).toLowerCase() ||
    path.extname(version.file_url).toLowerCase();

  let html: string | null = null;

  try {
    if (ext === ".docx") {
      try {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ path: filePath });
        if (result.value) html = result.value;
      } catch (err) {
        console.error("[html] mammoth conversion failed:", err);
      }
    } else if (ext === ".pdf") {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = await import("fs/promises").then((f) =>
          f.readFile(filePath),
        );
        const data = await pdfParse(buffer);
        const converted = pdfTextToHtml(data.text);
        if (converted) html = converted;
      } catch (err) {
        console.error("[html] pdf-parse conversion failed:", err);
      }
    } else if (ext === ".tex" || ext === ".latex") {
      try {
        const converted = extractLatexToHtml(filePath);
        if (converted && converted.length > 50) html = converted;
      } catch (err) {
        console.error("[html] latex conversion failed:", err);
      }
    } else {
      console.warn("[html] unsupported extension:", ext);
    }
  } finally {
    if (isTemp && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.warn("[html] temp cleanup failed:", err.message);
      });
    }
  }

  if (html) {
    await cacheVersionHtmlRepo(version.id, html);
  }

  return html;
}

export const getPublicPaperHtmlService = async (
  paperId: string,
): Promise<string | null> => {
  const version = await getPaperVersionForHtmlRepo(paperId);
  if (!version) {
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
    return null;
  }
  return convertVersionToHtml(version);
};

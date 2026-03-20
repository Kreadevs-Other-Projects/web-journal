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

export const getPublicPaperHtmlService = async (paperId: string): Promise<string | null> => {
  const version = await getPaperVersionForHtmlRepo(paperId);
  if (!version) return null;

  // Return cached HTML if available
  if (version.html_content) return version.html_content;

  // Only .docx is supported for conversion
  if (!version.file_url || !version.file_url.endsWith(".docx")) return null;

  // Option B: on-demand conversion for existing papers
  const filename = path.basename(version.file_url);
  const filePath = path.join(process.cwd(), "uploads", filename);

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
    return null;
  }

  return null;
};

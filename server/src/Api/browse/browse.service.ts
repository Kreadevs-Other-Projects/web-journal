import path from "path";
import mammoth from "mammoth";
import { getBrowseDataRepo, getPublicPaperRepo, getPaperVersionForHtmlRepo, cacheVersionHtmlRepo } from "./browse.repository";

export const getBrowseDataService = async (filters: any) => {
  const rows = await getBrowseDataRepo(filters);

  const grouped: any = {};

  rows.forEach((row) => {
    const issueKey = row.issue_id;

    if (!grouped[issueKey]) {
      grouped[issueKey] = {
        journal_id: row.journal_id,
        journal_title: row.journal_title,
        issn: row.issn,
        aims_and_scope: row.aims_and_scope,
        logo_url: row.logo_url,
        issue: `Vol ${row.volume} Issue ${row.issue} (${row.year})`,
        published_at: row.published_at,
        papers: [],
      };
    }

    grouped[issueKey].papers.push({
      id: row.paper_id,
      title: row.paper_title,
      abstract: row.abstract,
      pdf_url: row.file_url,
    });
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
  const filePath = path.join(__dirname, "../../../uploads", filename);

  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    if (result.value) {
      await cacheVersionHtmlRepo(version.id, result.value);
      return result.value;
    }
  } catch {
    return null;
  }

  return null;
};

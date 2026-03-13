import { getBrowseDataRepo, getPublicPaperRepo } from "./browse.repository";

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

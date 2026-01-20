import * as repo from "../repositories/publisher.repository";

export type Journal = {
  journalId: string;
  year: number;
  volume: number;
  issue: number;
  label: string;
};

export const fetchPublisherJournals = async (publisherId: string) => {
  return repo.getPublisherJournals(publisherId);
};

export const fetchJournalIssues = async (journalId: string) => {
  return repo.getJournalIssues(journalId);
};

export const addJournalIssue = async (journalId: string, data: Journal) => {
  return repo.createJournalIssue(
    journalId,
    data.year,
    data.volume,
    data.issue,
    data.label,
  );
};

export const setIssuePublished = async (issueId: string) => {
  return repo.publishIssue(issueId);
};

export const fetchJournalPapers = async (journalId: string) => {
  return repo.getJournalPapers(journalId);
};

export const setPaperPublished = async (
  paperId: string,
  publisherId: string,
) => {
  return repo.publishPaper(paperId, publisherId);
};

import {
  getAuthorJournals,
  getAuthorJournalIssues,
  getJournalAccessMeta,
} from "../repositories/author.repository";

export const getAuthorJournalsService = async () => {
  const result = await getAuthorJournals();
  return result;
};

export const getAuthorJournalIssuesService = async (journal_id: string) => {
  const journal = await getJournalAccessMeta(journal_id);

  if (!journal) {
    throw new Error("Journal not found");
  }

  if (journal.status !== "active") {
    throw new Error("This journal is not accepting submissions");
  }

  return await getAuthorJournalIssues(journal_id);
};

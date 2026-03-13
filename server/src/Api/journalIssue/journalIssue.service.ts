import {
  createJournalIssue,
  getJournalIssues,
  JournalIssueData,
  updateJournalIssue,
  deleteJournalIssue,
} from "./journalIssue.repository";
import { pool } from "../../configs/db";

export type { JournalIssueData };

export const addJournalIssueService = async (
  user: { id: string; role: string; email: string; username: string },
  journal_id: string,
  data: JournalIssueData,
) => {
  if (user.role !== "publisher" && user.role !== "journal_manager") {
    throw new Error("Only publishers or journal managers can create journal issues");
  }

  const journalResult = await pool.query(
    `SELECT id, title, owner_id, chief_editor_id FROM journals WHERE id = $1`,
    [journal_id],
  );

  if (!journalResult.rows.length) {
    throw new Error("Journal not found");
  }

  const issue = await createJournalIssue(journal_id, data);

  return { issue };
};

export const getJournalIssuesService = async (
  user: { id: string; role: string },
  journal_id: string,
) => {
  const journal = await pool.query(
    `SELECT id, owner_id FROM journals WHERE id = $1`,
    [journal_id],
  );

  if (!journal.rows.length) {
    throw new Error("Journal not found");
  }

  if (
    journal.rows[0].owner_id !== user.id &&
    user.role !== "publisher" &&
    user.role !== "author"
  ) {
    throw new Error("Forbidden");
  }

  return await getJournalIssues(journal_id);
};

export const updateJournalIssueService = async (
  user: { id: string; role: string },
  issue_id: string,
  data: JournalIssueData,
) => {
  if (user.role !== "owner" && user.role !== "publisher") {
    throw new Error("Only owners or publishers can create journal issues");
  }

  return await updateJournalIssue(issue_id, data);
};

export const deleteJournalIssueService = async (
  user: { id: string; role: string },
  issue_id: string,
) => {
  if (user.role !== "owner" && user.role !== "publisher") {
    throw new Error("Only owners can delete journal issues");
  }

  await deleteJournalIssue(issue_id);
};

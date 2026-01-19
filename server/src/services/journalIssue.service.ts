import {
  createJournalIssue,
  getJournalIssues,
  JournalIssueData,
  updateJournalIssue,
  deleteJournalIssue,
} from "../repositories/journalIssue.repository";
import { pool } from "../configs/db";

export type { JournalIssueData };

export const addJournalIssueService = async (
  user: { id: string; role: string },
  journal_id: string,
  data: JournalIssueData,
) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can create journal issues");
  }

  const journal = await pool.query(
    `SELECT id, owner_id FROM journals WHERE id = $1`,
    [journal_id],
  );

  if (!journal.rows.length) {
    throw new Error("Journal not found");
  }

  if (journal.rows[0].owner_id !== user.id) {
    throw new Error("You do not own this journal");
  }

  return await createJournalIssue(journal_id, data);
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

  if (journal.rows[0].owner_id !== user.id && user.role !== "admin") {
    throw new Error("Forbidden");
  }

  return await getJournalIssues(journal_id);
};

export const updateJournalIssueService = async (
  user: { id: string; role: string },
  issue_id: string,
  data: JournalIssueData,
) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can update journal issues");
  }

  return await updateJournalIssue(issue_id, data);
};

export const deleteJournalIssueService = async (
  user: { id: string; role: string },
  issue_id: string,
) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can delete journal issues");
  }

  await deleteJournalIssue(issue_id);
};

import { pool } from "../configs/db";
import {
  createJournal,
  getOwnerJournals,
  findJournals,
  findJournalById,
  updateJournalById,
  delteJournalById,
} from "../repositories/journal.repository";

export type Journal = {
  name: string;
  slug: string;
  description?: string;
  issn?: string;
  website_url?: string;
  chief_editor_id: string;
};

export const addJournalService = async (
  user: { id: string; role: string },
  data: Journal,
) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can create journals");
  }

  if (!data.name || !data.slug) {
    throw new Error("Journal name and slug are required");
  }

  if (!data.chief_editor_id) {
    throw new Error("Publisher must be selected");
  }

  const publisherCheck = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND role = 'chief_editor'`,
    [data.chief_editor_id],
  );

  if (!publisherCheck.rowCount) {
    throw new Error("Invalid chief editor selected");
  }

  return await createJournal(user.id, data);
};

export const getOwnerJournalService = async (user: {
  id: string;
  role: string;
}) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can access journals");
  }

  return await getOwnerJournals(user.id);
};

export const getJournalsService = async () => {
  try {
    const result = await findJournals();
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to find journals!");
  }
};

export const getJournalService = async (id: string) => {
  try {
    const result = await findJournalById(id);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to find journal!");
  }
};

export const updateJournalService = async (id: string, data: Journal) => {
  try {
    const result = await updateJournalById(id, data);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to update journal!");
  }
};

export const deleteJournalService = async (id: string) => {
  try {
    const result = await delteJournalById(id);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to delete journal!");
  }
};

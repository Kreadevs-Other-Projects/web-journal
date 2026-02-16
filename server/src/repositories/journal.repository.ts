import { pool } from "../configs/db";
import { Journal } from "../services/journal.service";

export const createJournal = async (owner_id: string, data: Journal) => {
  const { title, acronym, description, issn, website_url, chief_editor_id } =
    data;

  const result = await pool.query(
    `
    INSERT INTO journals
      (owner_id, chief_editor_id, title, acronym, description, issn, website_url)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, title, acronym, chief_editor_id
    `,
    [owner_id, chief_editor_id, title, acronym, description, issn, website_url],
  );

  return result.rows[0];
};

export const getOwnerJournals = async (owner_id: string) => {
  const result = await pool.query(
    `
    SELECT *
    FROM journals
    WHERE owner_id = $1
    ORDER BY created_at DESC
    `,
    [owner_id],
  );

  return result.rows;
};

export const findJournals = async () => {
  const result = await pool.query("SELECT * FROM journals");
  return result.rows;
};

export const findJournalById = async (id: string) => {
  const result = await pool.query("SELECT * FROM journals WHERE id = $1", [id]);
  return result.rows[0];
};

export const updateJournalById = async (id: string, data: Journal) => {
  const { title, acronym, description, issn, website_url, chief_editor_id } =
    data;

  const result = await pool.query(
    `
    UPDATE journals
    SET
      title = $1,
      acronym = $2,
      description = $3,
      issn = $4,
      website_url = $5,
      chief_editor_id = $6,
      updated_at = NOW()
    WHERE id = $7
    RETURNING id
    `,
    [title, acronym, description, issn, website_url, chief_editor_id, id],
  );

  return result.rows[0];
};

export const delteJournalById = async (id: string) => {
  await pool.query("DELETE FROM journals WHERE id = $1", [id]);
  return true;
};

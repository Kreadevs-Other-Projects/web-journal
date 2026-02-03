import { pool } from "../configs/db";
import { Journal } from "../services/journal.service";

export const createJournal = async (owner_id: string, data: Journal) => {
  const { name, slug, description, issn, website_url, chief_editor_id } = data;

  const result = await pool.query(
    `
    INSERT INTO journals
      (owner_id, chief_editor_id, name, slug, description, issn, website_url)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, slug, chief_editor_id
    `,
    [owner_id, chief_editor_id, name, slug, description, issn, website_url],
  );

  return result.rows[0];
};

export const getOwnerJournals = async (owner_id: string) => {
  const result = await pool.query(
    `
    SELECT id, name, slug, issn, website_url, created_at
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
  const { name, slug, description, issn, website_url } = data;

  const result = await pool.query(
    `
    UPDATE journals
    SET
      name = $1,
      slug = $2,
      description = $3,
      issn = $4,
      website_url = $5,
      updated_at = NOW()
    WHERE id = $6
    RETURNING id
    `,
    [name, slug, description, issn, website_url, id],
  );

  return result.rows[0];
};

export const delteJournalById = async (id: string) => {
  await pool.query("DELETE FROM journals WHERE id = $1", [id]);
  return true;
};

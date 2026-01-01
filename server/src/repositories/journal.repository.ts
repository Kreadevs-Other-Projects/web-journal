import { pool } from "../configs/db";
import { Journal } from "../services/journal.service";

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
    "UPDATE journals SET name = $1, slug = $2, description = $3, issn = $4, website_url = $5, updated_at = NOW() WHERE id = $6 RETURNING id",
    [name, slug, description, issn, website_url, id]
  );
  return result.rows[0];
};

export const delteJournalById = async (id: string) => {
  await pool.query("DELETE FROM journals WHERE id = $1", [id]);
  return true;
};

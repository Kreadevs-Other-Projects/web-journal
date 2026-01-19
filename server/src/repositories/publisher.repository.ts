import { pool } from "../configs/db";
import { Journal } from "../services/publisher.service";

export const createJournal = async (owner_id: string, data: Journal) => {
  const { name, slug, description, issn, website_url } = data;

  const result = await pool.query(
    `
    INSERT INTO journals (owner_id, name, slug, description, issn, website_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, slug
    `,
    [owner_id, name, slug, description, issn, website_url],
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

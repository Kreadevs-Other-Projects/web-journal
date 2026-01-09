import { pool } from "../configs/db";
import { Journal } from "../services/publisher.service";

export const createJournal = async (publisher_id: string, data: Journal) => {
  const { name, slug, description, issn, website_url } = data;
  const result = await pool.query(
    "INSERT INTO journals (publisher_id, name, slug, description, issn, website_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [publisher_id, name, slug, description, issn, website_url]
  );
  return result.rows[0];
};

export const getPublisherJorunal = async (publisher_id: string) => {
  const result = await pool.query(
    "SELECT * FROM journals WHERE publisher_id = $1",
    [publisher_id]
  );
  return result.rows;
};

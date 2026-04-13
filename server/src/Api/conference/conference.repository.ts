import { pool } from "../../configs/db";

export const getUpcomingConferencesRepo = async () => {
  const result = await pool.query(
    `SELECT id, title, date, location, link, created_at
     FROM conferences
     WHERE date >= CURRENT_DATE
     ORDER BY date ASC`,
  );
  return result.rows;
};

export const createConferenceRepo = async (
  title: string,
  date: string,
  location: string | null,
  link: string | null,
  createdBy: string,
) => {
  const result = await pool.query(
    `INSERT INTO conferences (title, date, location, link, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, date, location, link, created_at`,
    [title, date, location, link, createdBy],
  );
  return result.rows[0];
};

export const deleteConferenceRepo = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM conferences WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0] ?? null;
};

import { pool } from "../configs/db";

export const getJournals = async () => {
  const res = await pool.query(
    `SELECT * FROM journals WHERE status IN ('draft', 'active')`,
  );
  return res.rows;
};

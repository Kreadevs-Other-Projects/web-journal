import { pool } from "../../configs/db";

export const getAllCategories = async () => {
  const { rows } = await pool.query(
    `SELECT id, name, slug, created_at FROM paper_categories ORDER BY name ASC`
  );
  return rows;
};

export const createCategory = async (name: string, slug: string, userId: string) => {
  const { rows } = await pool.query(
    `INSERT INTO paper_categories (name, slug, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [name, slug, userId]
  );
  return rows[0];
};

export const deleteCategoryById = async (id: string) => {
  const { rowCount } = await pool.query(
    `DELETE FROM paper_categories WHERE id = $1`,
    [id]
  );
  return rowCount;
};

export const categoryExistsBySlug = async (slug: string) => {
  const { rows } = await pool.query(
    `SELECT 1 FROM paper_categories WHERE slug = $1`,
    [slug]
  );
  return rows.length > 0;
};

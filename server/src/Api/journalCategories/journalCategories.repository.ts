import { pool } from "../../configs/db";

export const getAllJournalCategories = async () => {
  const { rows } = await pool.query(
    `SELECT jc.id, jc.name, jc.slug, jc.description, jc.created_at,
            COUNT(j.id)::int AS journal_count
     FROM journal_categories jc
     LEFT JOIN journals j ON j.journal_category_id = jc.id
     GROUP BY jc.id
     ORDER BY jc.name ASC`
  );
  return rows;
};

export const createJournalCategory = async (name: string, slug: string, description: string | null, userId: string) => {
  const { rows } = await pool.query(
    `INSERT INTO journal_categories (name, slug, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, slug, description, userId]
  );
  return rows[0];
};

export const updateJournalCategory = async (id: string, name: string, slug: string, description: string | null) => {
  const { rows } = await pool.query(
    `UPDATE journal_categories SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *`,
    [name, slug, description, id]
  );
  return rows[0];
};

export const deleteJournalCategory = async (id: string) => {
  const { rowCount } = await pool.query(
    `DELETE FROM journal_categories WHERE id = $1`,
    [id]
  );
  return rowCount;
};

export const journalCategoryJournalCount = async (id: string): Promise<number> => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM journals WHERE journal_category_id = $1`,
    [id]
  );
  return rows[0].cnt;
};

export const journalCategoryExistsBySlug = async (slug: string, excludeId?: string) => {
  const { rows } = await pool.query(
    `SELECT 1 FROM journal_categories WHERE slug = $1 ${excludeId ? "AND id <> $2" : ""}`,
    excludeId ? [slug, excludeId] : [slug]
  );
  return rows.length > 0;
};

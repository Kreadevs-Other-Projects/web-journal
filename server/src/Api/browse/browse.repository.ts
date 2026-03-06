import { pool } from "../../configs/db";

export const getBrowseDataRepo = async (filters: any) => {
  const { search, year, journalId } = filters;

  let query = `
  SELECT 
    j.id as journal_id,
    j.title as journal_title,
    j.issn,
    ji.id as issue_id,
    ji.year,
    ji.volume,
    ji.issue,
    ji.published_at,
    p.id as paper_id,
    p.title as paper_title,
    p.abstract,
    pv.file_url,
    pv.version_number
  FROM journals j
  JOIN journal_issues ji 
      ON ji.journal_id = j.id
  JOIN papers p 
      ON p.issue_id = ji.id
      AND p.status = 'published'
  LEFT JOIN LATERAL (
      SELECT *
      FROM paper_versions pv2
      WHERE pv2.paper_id = p.id
      ORDER BY pv2.version_number DESC
      LIMIT 1
  ) pv ON true
  WHERE j.status = 'active'
`;

  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`p.title ILIKE $${values.length}`);
  }

  if (year) {
    values.push(year);
    conditions.push(`ji.year = $${values.length}`);
  }

  if (journalId) {
    values.push(journalId);
    conditions.push(`j.id = $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ` AND ` + conditions.join(" AND ");
  }

  query += `
    ORDER BY ji.year DESC, ji.volume DESC, ji.issue DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

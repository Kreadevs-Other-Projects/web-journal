import { pool } from "../../configs/db";

export const getPublicPaperRepo = async (paperId: string) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.title,
      p.abstract,
      p.keywords,
      p.author_names,
      p.corresponding_authors,
      p.paper_references,
      p.submitted_at,
      p.accepted_at,
      p.published_at,
      p.status,

      u.username AS author_username,

      j.id AS journal_id,
      j.title AS journal_title,
      j.issn,

      ji.volume,
      ji.issue,
      ji.year,
      ji.label AS issue_label,

      pub.doi,
      pub.article_index,
      pub.published_at AS publication_date,

      pv.file_url,
      pv.version_number,
      pv.html_content
    FROM papers p
    LEFT JOIN users u ON u.id = p.author_id
    LEFT JOIN journals j ON j.id = p.journal_id
    LEFT JOIN journal_issues ji ON ji.id = p.issue_id
    LEFT JOIN publications pub ON pub.paper_id = p.id
    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
    WHERE p.id = $1
    `,
    [paperId],
  );
  return result.rows[0] || null;
};

export const getBrowseDataRepo = async (filters: any) => {
  const { search, year, journalId } = filters;

  let query = `
  SELECT 
    j.id as journal_id,
    j.title as journal_title,
    j.issn,
    j.aims_and_scope,
    j.logo_url,
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

export const getPaperVersionForHtmlRepo = async (paperId: string) => {
  const result = await pool.query(
    `SELECT pv.id, pv.file_url, pv.html_content
     FROM paper_versions pv
     JOIN papers p ON p.current_version_id = pv.id
     WHERE p.id = $1`,
    [paperId],
  );
  return result.rows[0] || null;
};

export const cacheVersionHtmlRepo = async (versionId: string, html: string) => {
  await pool.query(
    "UPDATE paper_versions SET html_content = $1 WHERE id = $2",
    [html, versionId],
  );
};

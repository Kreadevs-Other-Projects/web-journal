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
      j.acronym,
      j.issn,

      ji.volume,
      ji.issue,
      ji.year,
      ji.label AS issue_label,

      pub.doi,
      pub.article_index,
      pub.url_slug,
      pub.paper_index,
      pub.published_at AS publication_date,
      pub.html_url,
      pub.pdf_url,
      pub.xml_url,

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
      AND (p.is_taken_down IS NULL OR p.is_taken_down = false)
    `,
    [paperId],
  );
  return result.rows[0] || null;
};

export const getPublicPaperBySlugRepo = async (
  acronym: string,
  slug: string,
) => {
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
      p.article_type,
      p.conflict_of_interest,
      p.funding_info,
      p.data_availability,
      p.ethical_approval,
      p.author_contributions,

      u.username AS author_username,

      j.id AS journal_id,
      j.title AS journal_title,
      j.acronym,
      j.issn,

      ji.volume,
      ji.issue,
      ji.year,
      ji.label AS issue_label,

      pub.doi,
      pub.article_index,
      pub.url_slug,
      pub.paper_index,
      pub.published_at AS publication_date,
      pub.html_url,
      pub.pdf_url,
      pub.xml_url,

      pv.file_url,
      pv.version_number,
      pv.html_content
    FROM publications pub
    JOIN papers p ON p.id = pub.paper_id
    JOIN journals j ON j.id = p.journal_id
    JOIN journal_issues ji ON ji.id = pub.issue_id
    LEFT JOIN users u ON u.id = p.author_id
    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
    WHERE LOWER(j.acronym) = LOWER($1)
      AND pub.url_slug = $2
      AND (p.is_taken_down IS NULL OR p.is_taken_down = false)
    `,
    [acronym, slug],
  );
  return result.rows[0] || null;
};

export const getPaperSlugRepo = async (paperId: string) => {
  const result = await pool.query(
    `SELECT j.acronym, pub.url_slug
     FROM publications pub
     JOIN papers p ON p.id = pub.paper_id
     JOIN journals j ON j.id = p.journal_id
     WHERE pub.paper_id = $1`,
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
    j.journal_category_id,
    jc.name as category_name,
    jc.slug as category_slug,
    j.created_at as journal_created_at,
    ji.id as issue_id,
    ji.year,
    ji.volume,
    ji.issue,
    ji.published_at,
    p.id as paper_id,
    p.title as paper_title,
    p.abstract,
    j.acronym,
    pv.file_url,
    pv.version_number,
    pub.url_slug
  FROM journals j
  LEFT JOIN journal_categories jc ON jc.id = j.journal_category_id
  LEFT JOIN journal_issues ji
      ON ji.journal_id = j.id
  LEFT JOIN papers p
      ON p.issue_id = ji.id
      AND p.status = 'published'
  LEFT JOIN publications pub ON pub.paper_id = p.id
  LEFT JOIN LATERAL (
      SELECT *
      FROM paper_versions pv2
      WHERE pv2.paper_id = p.id
      ORDER BY pv2.version_number DESC
      LIMIT 1
  ) pv ON true
  WHERE (j.status = 'active' OR j.status IS NULL)
    AND (j.is_taken_down IS NULL OR j.is_taken_down = false)
    AND (ji.is_taken_down IS NULL OR ji.is_taken_down = false)
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

export const getPublicJournalsRepo = async (filters: {
  limit: number;
  q?: string;
  type?: string;
  open?: boolean;
  category_id?: string;
}) => {
  const { limit, q, type, open, category_id } = filters;
  const values: any[] = [limit];
  let where = `WHERE (j.status = 'active' OR j.status IS NULL)`;

  if (q) {
    values.push(`%${q}%`);
    where += ` AND (j.title ILIKE $${values.length} OR j.issn ILIKE $${values.length})`;
  }
  if (type) {
    values.push(type);
    where += ` AND j.type = $${values.length}`;
  }
  if (category_id) {
    values.push(category_id);
    where += ` AND j.journal_category_id = $${values.length}`;
  }

  let openJoin = "";
  if (open) {
    openJoin = `JOIN journal_issues ji_open ON ji_open.journal_id = j.id AND ji_open.status = 'open'`;
  }

  const result = await pool.query(
    `SELECT
       j.id,
       j.title,
       j.issn,
       j.type,
       j.logo_url,
       j.aims_and_scope,
       j.journal_category_id,
       jc.name AS category_name,
       jc.slug AS category_slug,
       COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'published')::int AS article_count
     FROM journals j
     ${openJoin}
     LEFT JOIN papers p ON p.journal_id = j.id
     LEFT JOIN journal_categories jc ON jc.id = j.journal_category_id
     ${where}
     GROUP BY j.id, jc.name, jc.slug
     ORDER BY j.created_at DESC
     LIMIT $1`,
    values,
  );
  return result.rows;
};

export const getOpenJournalsRepo = async () => {
  const result = await pool.query(
    `SELECT DISTINCT ON (j.id)
       j.id,
       j.title,
       j.acronym,
       j.logo_url,
       j.issn,
       j.type,
       ji.id AS open_issue_id,
       ji.label AS open_issue_label,
       (99 - (SELECT COUNT(*) FROM papers p2 WHERE p2.issue_id = ji.id))::int AS slots_remaining
     FROM journals j
     JOIN journal_issues ji ON ji.journal_id = j.id AND ji.status = 'open'
     WHERE j.status = 'active' OR j.status IS NULL
     ORDER BY j.id, ji.created_at DESC`,
  );
  return result.rows;
};

export const getLatestPublishedPapersRepo = async (filters: {
  limit: number;
  offset?: number;
  q?: string;
  category?: string;
  year?: number;
}) => {
  const { limit, offset = 0, q, category, year } = filters;
  const values: any[] = [];
  const conds: string[] = [`p.status = 'published'`];

  if (q) {
    values.push(`%${q}%`);
    conds.push(
      `(p.title ILIKE $${values.length} OR p.keywords::text ILIKE $${values.length})`,
    );
  }
  if (category) {
    values.push(category);
    conds.push(`p.category = $${values.length}`);
  }
  if (year) {
    values.push(year);
    conds.push(
      `EXTRACT(YEAR FROM COALESCE(p.published_at, p.updated_at)) = $${values.length}`,
    );
  }

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT
       p.id,
       p.title,
       p.author_names,
       p.keywords,
       p.category,
       p.published_at,
       p.updated_at,
       j.title AS journal_title,
       j.id AS journal_id,
       j.acronym,
       pub.url_slug
     FROM papers p
     LEFT JOIN journals j ON j.id = p.journal_id
     LEFT JOIN publications pub ON pub.paper_id = p.id
     WHERE ${conds.join(" AND ")}
     ORDER BY COALESCE(p.published_at, p.updated_at) DESC NULLS LAST
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return result.rows;
};

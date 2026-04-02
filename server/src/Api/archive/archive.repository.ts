import { pool } from "../../configs/db";

export const getArchiveRepo = async (filters: {
  journal_id?: string;
  year?: number;
  volume?: number;
  issue?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { journal_id, year, volume, issue, search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["p.status = 'published'"];
  const values: any[] = [];

  if (journal_id) {
    values.push(journal_id);
    conditions.push(`j.id = $${values.length}`);
  }
  if (year) {
    values.push(year);
    conditions.push(`ji.year = $${values.length}`);
  }
  if (volume) {
    values.push(volume);
    conditions.push(`ji.volume = $${values.length}`);
  }
  if (issue) {
    values.push(issue);
    conditions.push(`ji.issue = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(p.title ILIKE $${values.length} OR p.author_names::text ILIKE $${values.length})`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(limit, offset);
  const dataQuery = `
    SELECT
      p.id as paper_id,
      p.title as paper_title,
      p.author_names,
      p.published_at,
      j.id as journal_id,
      j.title as journal_title,
      j.acronym,
      j.issn,
      ji.id as issue_id,
      ji.year,
      ji.volume,
      ji.issue,
      ji.label as issue_label,
      pub.doi,
      pub.article_index,
      pub.url_slug,
      pv.file_url
    FROM papers p
    JOIN publications pub ON pub.paper_id = p.id
    JOIN journals j ON j.id = p.journal_id
    JOIN journal_issues ji ON ji.id = pub.issue_id
    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
    ${where}
    ORDER BY ji.year DESC, ji.volume DESC, ji.issue DESC, pub.published_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  const countValues = values.slice(0, -2);
  const countQuery = `
    SELECT COUNT(*)::int as total
    FROM papers p
    JOIN publications pub ON pub.paper_id = p.id
    JOIN journals j ON j.id = p.journal_id
    JOIN journal_issues ji ON ji.id = pub.issue_id
    ${where}
  `;

  const [dataRes, countRes] = await Promise.all([
    pool.query(dataQuery, values),
    pool.query(countQuery, countValues),
  ]);

  return { papers: dataRes.rows, total: countRes.rows[0]?.total || 0 };
};

export const getArchiveFiltersRepo = async () => {
  const [journalsRes, yearsRes] = await Promise.all([
    pool.query(`SELECT DISTINCT j.id, j.title FROM journals j JOIN publications pub ON pub.paper_id IN (SELECT id FROM papers WHERE journal_id = j.id) ORDER BY j.title`),
    pool.query(`SELECT DISTINCT ji.year FROM journal_issues ji JOIN papers p ON p.issue_id = ji.id WHERE p.status = 'published' ORDER BY ji.year DESC`),
  ]);
  return {
    journals: journalsRes.rows,
    years: yearsRes.rows.map((r: { year: number }) => r.year),
  };
};

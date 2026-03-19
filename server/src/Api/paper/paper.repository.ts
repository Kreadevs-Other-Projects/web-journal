import { pool } from "../../configs/db";

export const createPaper = async (data: {
  title: string;
  abstract?: string;
  category?: string;
  article_type?: string;
  keywords: string[];
  journal_id: string;
  author_id: string;
  issue_id?: string;
  author_names: string[];
  corresponding_authors?: string[];
  author_details?: object[];
  corresponding_author_details?: object[];
  paper_references?: { text: string; link?: string }[];
  manuscript_url?: string;
  conflict_of_interest?: string;
  funding_info?: string;
  data_availability?: string;
  ethical_approval?: string;
  author_contributions?: string;
}) => {
  const result = await pool.query(
    `INSERT INTO papers
      (title, abstract, category, article_type, keywords, journal_id, author_id, issue_id,
       author_names, corresponding_authors, author_details, corresponding_author_details,
       paper_references, manuscript_url, conflict_of_interest, funding_info,
       data_availability, ethical_approval, author_contributions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [
      data.title,
      data.abstract || "",
      data.category || null,
      data.article_type || null,
      data.keywords,
      data.journal_id,
      data.author_id,
      data.issue_id || null,
      data.author_names,
      data.corresponding_authors || [],
      JSON.stringify(data.author_details || []),
      JSON.stringify(data.corresponding_author_details || []),
      JSON.stringify(data.paper_references || []),
      data.manuscript_url || null,
      data.conflict_of_interest || null,
      data.funding_info || null,
      data.data_availability || null,
      data.ethical_approval || null,
      data.author_contributions || null,
    ],
  );

  return result.rows[0];
};

export const insertStatusLog = async (data: {
  paper_id: string;
  status: string;
  changed_by?: string;
  note?: string;
}) => {
  await pool.query(
    `INSERT INTO paper_status_log (paper_id, status, changed_by, note)
     VALUES ($1, $2, $3, $4)`,
    [data.paper_id, data.status, data.changed_by || null, data.note || null],
  );
};

export const getKeywordSuggestions = async (q: string) => {
  const result = await pool.query(
    `SELECT DISTINCT unnest(keywords) AS keyword
     FROM papers
     WHERE EXISTS (
       SELECT 1 FROM unnest(keywords) AS k WHERE k ILIKE $1
     )
     LIMIT 20`,
    [`%${q}%`],
  );
  return result.rows.map((r: { keyword: string }) => r.keyword);
};

export const getPaperById = async (id: string) => {
  const result = await pool.query(`SELECT * FROM papers WHERE id = $1`, [id]);
  return result.rows[0];
};

export const getAllPapers = async () => {
  const result = await pool.query(`
    SELECT 
      p.id,
      p.title,
      p.abstract,
      p.category,
      p.keywords,
      p.status AS paper_status,
      p.journal_id,
      p.issue_id,
      p.current_version_id,
      p.submitted_at,
      p.accepted_at,
      p.published_at,
      p.created_at,
      p.updated_at,

      u.id AS author_id,
      u.username AS authors,
      u.email AS author_email,

      j.title AS journal_name,
      ji.label,

      COALESCE(pp.status, 'pending') AS payment_status

    FROM papers p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN journals j ON p.journal_id = j.id
    LEFT JOIN journal_issues ji ON p.issue_id = ji.id
    LEFT JOIN paper_payments pp ON pp.paper_id = p.id

    ORDER BY p.created_at DESC
  `);

  return result.rows;
};

export const getPapersByAuthor = async (author_id: string) => {
  const result = await pool.query(`SELECT * FROM papers WHERE author_id = $1`, [
    author_id,
  ]);
  return result.rows;
};

export const updatePaperStatus = async (paper_id: string, status: string) => {
  const result = await pool.query(
    `
    UPDATE papers
    SET status = $1,
        accepted_at = CASE WHEN $1 = 'accepted' THEN NOW() ELSE accepted_at END,
        published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, paper_id],
  );

  return result.rows[0];
};

export const setCurrentVersion = async (
  paper_id: string,
  version_id: string,
) => {
  await pool.query(
    `
    UPDATE papers
    SET current_version_id = $1,
        updated_at = NOW()
    WHERE id = $2
    `,
    [version_id, paper_id],
  );
};

export const assignPaperToIssue = async (
  paper_id: string,
  issue_id: string,
) => {
  const result = await pool.query(
    `UPDATE papers
     SET issue_id = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [issue_id, paper_id],
  );
  return result.rows[0];
};

export const getPaperTracking = async (paperId: string, authorId: string) => {
  const paperRes = await pool.query(
    `SELECT p.id, p.title, p.status, p.submitted_at, p.accepted_at, p.published_at,
            p.updated_at, p.abstract, p.category, p.article_type, p.keywords,
            p.author_names, p.corresponding_authors, p.author_details, p.corresponding_author_details,
            j.title as journal_title,
            ji.label as issue_label, ji.volume as issue_volume,
            ji.issue as issue_number, ji.year as issue_year
     FROM papers p
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN journal_issues ji ON ji.id = p.issue_id
     WHERE p.id = $1 AND p.author_id = $2`,
    [paperId, authorId],
  );
  if (!paperRes.rows.length) return null;

  // Status log — omit internal editor identity for blind review
  const logRes = await pool.query(
    `SELECT psl.status, psl.changed_at
     FROM paper_status_log psl
     WHERE psl.paper_id = $1
     ORDER BY psl.changed_at ASC`,
    [paperId],
  );

  // Reviews — anonymised (no reviewer name/email)
  const reviewRes = await pool.query(
    `SELECT r.decision, r.comments, ra.submitted_at
     FROM reviews r
     JOIN review_assignments ra ON ra.id = r.review_assignment_id
     WHERE ra.paper_id = $1 AND ra.status = 'submitted'
     ORDER BY ra.submitted_at ASC`,
    [paperId],
  );

  const pubRes = await pool.query(
    `SELECT pub.doi, pub.published_at, ji.label as issue_label, ji.volume, ji.year
     FROM publications pub
     LEFT JOIN journal_issues ji ON ji.id = pub.issue_id
     WHERE pub.paper_id = $1`,
    [paperId],
  );

  // Latest paper version for revision upload
  const versionRes = await pool.query(
    `SELECT version_number FROM paper_versions WHERE paper_id = $1 ORDER BY version_number DESC LIMIT 1`,
    [paperId],
  );

  return {
    paper: paperRes.rows[0],
    status_log: logRes.rows,
    reviews: reviewRes.rows,
    publication: pubRes.rows[0] || null,
    latest_version_number: versionRes.rows[0]?.version_number || 1,
  };
};

export const getPaperMetadata = async (paperId: string) => {
  const result = await pool.query(
    `SELECT p.id, p.title, p.abstract, p.keywords, p.author_names, p.paper_references,
            j.title as journal_title,
            ji.volume, ji.issue, ji.year,
            pub.doi, pub.published_at as publication_date
     FROM papers p
     LEFT JOIN journals j ON j.id = p.journal_id
     LEFT JOIN journal_issues ji ON ji.id = p.issue_id
     LEFT JOIN publications pub ON pub.paper_id = p.id
     WHERE p.id = $1`,
    [paperId],
  );
  return result.rows[0] || null;
};

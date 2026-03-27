import { pool } from "../../configs/db";
import { Journal, PublisherJournalData } from "./journal.service";

export const createJournal = async (owner_id: string, data: Journal) => {
  const { title, acronym, description, issn, website_url, chief_editor_id } =
    data;

  const result = await pool.query(
    `
    INSERT INTO journals
      (owner_id, chief_editor_id, title, acronym, description, issn, website_url)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, title, acronym, chief_editor_id
    `,
    [owner_id, chief_editor_id, title, acronym, description, issn, website_url],
  );

  return result.rows[0];
};

export const getOwnerJournals = async (owner_id: string) => {
  const result = await pool.query(
    `
    SELECT 
      j.*,
      u.username AS chief_editor_username
    FROM journals j
    LEFT JOIN users u 
      ON j.chief_editor_id = u.id
    WHERE j.owner_id = $1
    ORDER BY j.created_at DESC
    `,
    [owner_id],
  );

  return result.rows;
};

export const findJournals = async () => {
  const result = await pool.query("SELECT * FROM journals");
  return result.rows;
};

export const findJournalById = async (id: string) => {
  const result = await pool.query("SELECT * FROM journals WHERE id = $1", [id]);
  return result.rows[0];
};

export const updateJournalById = async (id: string, data: Journal) => {
  const { title, acronym, description, issn, website_url, chief_editor_id } =
    data;

  const result = await pool.query(
    `
    UPDATE journals
    SET
      title = $1,
      acronym = $2,
      description = $3,
      issn = $4,
      website_url = $5,
      chief_editor_id = $6,
      updated_at = NOW()
    WHERE id = $7
    RETURNING id
    `,
    [title, acronym, description, issn, website_url, chief_editor_id, id],
  );

  return result.rows[0];
};

export const delteJournalById = async (id: string) => {
  await pool.query("DELETE FROM journals WHERE id = $1", [id]);
  return true;
};

export const findEditorialBoard = async (journalId: string) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (u.id)
      u.id,
      u.username AS name,
      up.profile_pic_url,
      up.degrees,
      up.keywords,
      src.role
    FROM (
      -- Source 1: explicitly assigned via user_roles
      SELECT user_id, role
      FROM user_roles
      WHERE journal_id = $1
        AND is_active = true
        AND role IN ('chief_editor', 'sub_editor')

      UNION

      -- Source 2: sub editors assigned to papers in this journal via editor_assignments
      SELECT ea.sub_editor_id AS user_id, 'sub_editor' AS role
      FROM editor_assignments ea
      JOIN papers p ON p.id = ea.paper_id
      WHERE p.journal_id = $1
    ) src
    JOIN users u ON u.id = src.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    ORDER BY u.id, (src.role = 'chief_editor') DESC`,
    [journalId],
  );

  console.log(
    "Editorial board sub editors:",
    result.rows.filter((r) => r.role === "sub_editor"),
  );

  const chief_editors = result.rows.filter((r) => r.role === "chief_editor");
  const associate_editors = result.rows.filter((r) => r.role === "sub_editor");
  return { chief_editors, associate_editors };
};

export const createJournalByPublisher = async (
  publisher_id: string,
  chief_editor_id: string | null,
  data: PublisherJournalData,
) => {
  const result = await pool.query(
    `
    INSERT INTO journals
      (owner_id, chief_editor_id, title, acronym, issn, doi, publisher_name,
       type, peer_review_policy, oa_policy, author_guidelines, aims_and_scope, publication_fee, currency, logo_url, status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active')
    RETURNING id, title, acronym
    `,
    [
      publisher_id,
      chief_editor_id,
      data.title,
      (data.acronym ?? "").toUpperCase(),
      data.issn || null,
      data.doi || null,
      data.publisher_name,
      data.type,
      data.peer_review_policy,
      data.oa_policy,
      data.author_guidelines,
      data.aims_and_scope ?? null,
      data.publication_fee ?? null,
      data.currency ?? null,
      data.logo_url ?? null,
    ],
  );
  return result.rows[0];
};

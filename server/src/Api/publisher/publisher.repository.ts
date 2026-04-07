import { pool } from "../../configs/db";

export const approveJournalRepo = async (
  journalId: string,
  issueId: string,
) => {
  // PAYMENT_DISABLED: Removed payment/invoice check per client instruction (Mar 2026)
  const result = await pool.query(
    `
    UPDATE journal_issues
    SET status = 'open', updated_at = NOW()
    WHERE id = $1 AND journal_id = $2
    RETURNING id
    `,
    [issueId, journalId],
  );

  if (!result.rows.length) {
    throw new Error("Issue not found for this journal");
  }
};

export const activateUserRepo = async (userId: string) => {
  await pool.query(
    `UPDATE users
     SET status = 'active'
     WHERE id = $1`,
    [userId],
  );
};

export const getPublisherJournals = async (publisherId: string) => {
  const result = await pool.query(
    `
    SELECT
      j.*,

      -- chief editor user (nullable)
      CASE WHEN ce.id IS NOT NULL THEN
        json_build_object(
          'id', ce.id,
          'name', ce.username,
          'email', ce.email,
          'created_at', ce.created_at
        )
      ELSE NULL END AS chief_editor,

      -- owner user
      json_build_object(
        'id', o.id,
        'name', o.username,
        'email', o.email,
        'created_at', o.created_at
      ) AS owner,

      -- Latest Chief Editor Invitation Data
      inv.status AS chief_editor_invitation_status,
      inv.email AS chief_editor_email,

      -- journal issues array
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', ji.id,
            'year', ji.year,
            'volume', ji.volume,
            'issue', ji.issue,
            'label', ji.label,
            'issueStatus', ji.status,
            'published_at', ji.published_at,
            'updated_at', ji.updated_at,
            'paper_count', COALESCE(ipc.cnt, 0)
          ) ORDER BY ji.created_at DESC
        ) FILTER (WHERE ji.id IS NOT NULL),
        '[]'
      ) AS issues

    FROM journals j
    LEFT JOIN users ce ON ce.id = j.chief_editor_id
    JOIN users o ON o.id = j.owner_id
    LEFT JOIN journal_issues ji ON ji.journal_id = j.id
    
    -- Subquery to get the latest chief editor invitation
    LEFT JOIN (
      SELECT DISTINCT ON (journal_id) 
        journal_id, status, email 
      FROM staff_invitations 
      WHERE role = 'chief_editor' 
      ORDER BY journal_id, created_at DESC
    ) inv ON inv.journal_id = j.id

    LEFT JOIN (
      SELECT issue_id, COUNT(*)::int AS cnt FROM papers GROUP BY issue_id
    ) ipc ON ipc.issue_id = ji.id

    WHERE j.owner_id = $1

    GROUP BY j.id, ce.id, o.id, inv.status, inv.email
    ORDER BY j.created_at DESC
  `,
    [publisherId],
  );

  return result.rows;
};

export const getJournalIssues = async (journalId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM journal_issues
     WHERE journal_id = $1
     ORDER BY year DESC, volume DESC, issue DESC`,
    [journalId],
  );
  return result.rows;
};

export const createJournalPayment = async ({
  journalId,
  ownerId,
  issueId,
  amount,
  currency,
  status,
}: {
  journalId: string;
  ownerId: string;
  issueId?: string | null;
  amount: number;
  currency?: string;
  status?: "pending" | "success" | "failed";
}) => {
  const res = await pool.query(
    `
    INSERT INTO journal_payments (journal_id, owner_id, issue_id, amount, currency, status, payment_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      journalId,
      ownerId,
      issueId || null,
      amount,
      currency || "PKR",
      status || "pending",
      "first_time",
    ],
  );
  return res.rows[0];
};

export const replaceChiefEditorRepo = async (
  journalId: string,
  publisherId: string,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get current CE id
    const { rows: journalRows } = await client.query(
      `SELECT chief_editor_id FROM journals WHERE id = $1 AND owner_id = $2`,
      [journalId, publisherId],
    );
    if (!journalRows.length)
      throw new Error("Journal not found or access denied");
    const currentCeId = journalRows[0].chief_editor_id;

    // 2. Deactivate old CE role in user_roles
    if (currentCeId) {
      await client.query(
        `UPDATE user_roles SET is_active = false WHERE user_id = $1 AND role = 'chief_editor' AND journal_id = $2`,
        [currentCeId, journalId],
      );
    }

    // 3. Null out journals.chief_editor_id
    await client.query(
      `UPDATE journals SET chief_editor_id = NULL, updated_at = NOW() WHERE id = $1`,
      [journalId],
    );

    // 4. Cancel any pending CE invitations for this journal
    await client.query(
      `UPDATE staff_invitations SET status = 'cancelled'
       WHERE journal_id = $1 AND role = 'chief_editor' AND status = 'pending'`,
      [journalId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const replaceJournalManagerRepo = async (
  journalId: string,
  publisherId: string,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get current JM id
    const { rows: journalRows } = await client.query(
      `SELECT journal_manager_id FROM journals WHERE id = $1 AND owner_id = $2`,
      [journalId, publisherId],
    );
    if (!journalRows.length)
      throw new Error("Journal not found or access denied");
    const currentJmId = journalRows[0].journal_manager_id;

    // 2. Deactivate old JM role in user_roles
    if (currentJmId) {
      await client.query(
        `UPDATE user_roles SET is_active = false WHERE user_id = $1 AND role = 'journal_manager' AND journal_id = $2`,
        [currentJmId, journalId],
      );
    }

    // 3. Null out journals.journal_manager_id
    await client.query(
      `UPDATE journals SET journal_manager_id = NULL, updated_at = NOW() WHERE id = $1`,
      [journalId],
    );

    // 4. Cancel any pending JM invitations for this journal
    await client.query(
      `UPDATE staff_invitations SET status = 'cancelled'
       WHERE journal_id = $1 AND role = 'journal_manager' AND status = 'pending'`,
      [journalId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const publishIssue = async (issueId: string) => {
  const result = await pool.query(
    `UPDATE journal_issues
     SET published_at=NOW(), updated_at=NOW()
     WHERE id = $1
     RETURNING *`,
    [issueId],
  );
  return result.rows[0];
};

export const getJournalPapers = async (journalId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM papers
     WHERE journal_id = $1
     ORDER BY created_at DESC`,
    [journalId],
  );
  return result.rows;
};

export const getPapersByIssueIdRepo = async (issueId: string) => {
  const result = await pool.query(
    `
    SELECT 
      p.id,
      p.title,
      p.abstract,
      p.status,
      p.created_at,
      u.id AS author_id,
      u.username AS author_name
    FROM papers p
    JOIN users u ON u.id = p.author_id
    WHERE p.issue_id = $1
    AND p.status = 'accepted'
    ORDER BY p.created_at DESC
    `,
    [issueId],
  );

  return result.rows;
};

export const approvePaperPaymentRepo = async (paperId: string) => {
  const check = await pool.query(
    `SELECT id FROM paper_payments WHERE paper_id = $1`,
    [paperId],
  );

  if (check.rowCount === 0) {
    throw new Error("Send invoice first");
  }

  const result = await pool.query(
    `
    UPDATE paper_payments
    SET status   = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE paper_id = $1
    RETURNING *
  `,
    [paperId],
  );

  return result.rows[0];
};

export const getPaymentsByJournal = async () => {
  const result = await pool.query(
    `SELECT *
     FROM journal_payments
     ORDER BY created_at ASC`,
  );
  return result.rows;
};

export const getPaymentById = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT id, journal_id FROM journal_payments WHERE id = $1`,
    [id],
  );

  return rows[0];
};

export const updatePaymentStatus = async (id: string, status: string) => {
  await pool.query(
    `UPDATE journal_payments SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id],
  );
};

export const updateJournalStatus = async (
  journalId: string,
  status: string,
) => {
  await pool.query(
    `UPDATE journals SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, journalId],
  );
};

// ===== TAKEDOWN =====

export const takedownJournalRepo = async (
  journalId: string,
  reason: string,
  publisherId: string,
) => {
  await pool.query(
    `UPDATE journals SET is_taken_down = true, takedown_reason = $1, taken_down_at = NOW(), taken_down_by = $2 WHERE id = $3`,
    [reason, publisherId, journalId],
  );
  // Cascade to issues and papers
  await pool.query(
    `UPDATE journal_issues SET is_taken_down = true, takedown_reason = $1, taken_down_at = NOW() WHERE journal_id = $2`,
    [reason, journalId],
  );
  await pool.query(
    `UPDATE papers SET is_taken_down = true, takedown_reason = $1, taken_down_at = NOW(), taken_down_by = $2
     WHERE journal_id = $3`,
    [reason, publisherId, journalId],
  );
};

export const restoreJournalRepo = async (journalId: string) => {
  await pool.query(
    `UPDATE journals SET is_taken_down = false, takedown_reason = NULL, taken_down_at = NULL, taken_down_by = NULL WHERE id = $1`,
    [journalId],
  );
};

export const takedownIssueRepo = async (issueId: string, reason: string, publisherId: string) => {
  await pool.query(
    `UPDATE journal_issues SET is_taken_down = true, takedown_reason = $1, taken_down_at = NOW() WHERE id = $2`,
    [reason, issueId],
  );
  await pool.query(
    `UPDATE papers SET is_taken_down = true, takedown_reason = $1, taken_down_at = NOW(), taken_down_by = $2
     WHERE issue_id = $3`,
    [reason, publisherId, issueId],
  );
};

export const restoreIssueRepo = async (issueId: string) => {
  await pool.query(
    `UPDATE journal_issues SET is_taken_down = false, takedown_reason = NULL, taken_down_at = NULL WHERE id = $1`,
    [issueId],
  );
};

export const takedownPaperRepo = async (paperId: string, reason: string, publisherId: string) => {
  const result = await pool.query(
    `UPDATE papers SET is_taken_down = true, takedown_reason = $1, taken_down_at = NOW(), taken_down_by = $2 WHERE id = $3 RETURNING *`,
    [reason, publisherId, paperId],
  );
  return result.rows[0];
};

export const restorePaperRepo = async (paperId: string) => {
  const result = await pool.query(
    `UPDATE papers SET is_taken_down = false, takedown_reason = NULL, taken_down_at = NULL, taken_down_by = NULL WHERE id = $1 RETURNING *`,
    [paperId],
  );
  return result.rows[0];
};

export const getJournalChiefEditorEmail = async (journalId: string): Promise<string | null> => {
  const result = await pool.query(
    `SELECT u.email, j.title AS journal_title
     FROM journals j
     LEFT JOIN users u ON u.id = j.chief_editor_id
     WHERE j.id = $1`,
    [journalId],
  );
  return result.rows[0] || null;
};

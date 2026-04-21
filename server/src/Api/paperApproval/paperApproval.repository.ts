import { pool } from "../../configs/db";

export const getApprovalByToken = async (token: string) => {
  const result = await pool.query(
    `SELECT pa.*, p.title, p.abstract, p.author_names, p.author_details, p.journal_id,
            j.title AS journal_name,
            u.username AS submitted_by, u.email AS author_email
     FROM paper_approvals pa
     JOIN papers p ON p.id = pa.paper_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN users u ON u.id = p.author_id
     WHERE pa.token = $1`,
    [token],
  );
  return result.rows[0] || null;
};

export const approveByToken = async (token: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const approvalRes = await client.query(
      `UPDATE paper_approvals SET status = 'approved', responded_at = NOW()
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
       RETURNING paper_id`,
      [token],
    );
    if (!approvalRes.rows.length) throw new Error("Token not found, expired, or already used");

    const paperId = approvalRes.rows[0].paper_id;

    await client.query(
      "UPDATE papers SET status = 'submitted', updated_at = NOW() WHERE id = $1",
      [paperId],
    );

    await client.query(
      `INSERT INTO paper_status_log (paper_id, status, note)
       VALUES ($1, 'submitted', 'Approved by corresponding author')`,
      [paperId],
    );

    await client.query("COMMIT");
    return paperId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const rejectByToken = async (token: string, reason: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const approvalRes = await client.query(
      `UPDATE paper_approvals SET status = 'rejected', rejection_reason = $2, responded_at = NOW()
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
       RETURNING paper_id`,
      [token, reason],
    );
    if (!approvalRes.rows.length) throw new Error("Token not found, expired, or already used");

    const paperId = approvalRes.rows[0].paper_id;

    await client.query(
      "UPDATE papers SET status = 'ca_rejected', updated_at = NOW() WHERE id = $1",
      [paperId],
    );

    await client.query(
      `INSERT INTO paper_status_log (paper_id, status, note)
       VALUES ($1, 'ca_rejected', $2)`,
      [paperId, `Rejected by corresponding author: ${reason}`],
    );

    await client.query("COMMIT");
    return paperId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getPaperAuthorForNotification = async (paperId: string) => {
  const result = await pool.query(
    `SELECT u.email, u.username, p.title, j.title AS journal_name, j.chief_editor_id,
            ce.email AS ce_email, ce.username AS ce_username
     FROM papers p
     JOIN users u ON u.id = p.author_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN users ce ON ce.id = j.chief_editor_id
     WHERE p.id = $1`,
    [paperId],
  );
  return result.rows[0] || null;
};

import { pool } from "../../configs/db";

export const createInvitation = async (data: {
  email: string;
  name: string;
  role: string;
  journal_id: string;
  paper_id?: string | null;
  invited_by: string;
}) => {
  const result = await pool.query(
    `INSERT INTO staff_invitations (email, name, role, journal_id, paper_id, invited_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.email,
      data.name,
      data.role,
      data.journal_id,
      data.paper_id ?? null,
      data.invited_by,
    ],
  );
  return result.rows[0];
};

export const findInvitationByToken = async (token: string) => {
  const result = await pool.query(
    `SELECT si.*,
            j.title AS journal_name,
            u.username AS invited_by_name
     FROM staff_invitations si
     LEFT JOIN journals j ON j.id = si.journal_id
     LEFT JOIN users u ON u.id = si.invited_by
     WHERE si.token = $1`,
    [token],
  );
  return result.rows[0] || null;
};

export const findInvitationById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM staff_invitations WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

export const markInvitationAccepted = async (id: string) => {
  await pool.query(
    `UPDATE staff_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
    [id],
  );
};

export const markInvitationCancelled = async (id: string) => {
  await pool.query(
    `UPDATE staff_invitations SET status = 'cancelled' WHERE id = $1`,
    [id],
  );
};

export const getInvitationsForJournal = async (journal_id: string) => {
  const result = await pool.query(
    `SELECT si.id, si.name, si.email, si.role, si.status,
            si.expires_at, si.accepted_at, si.created_at,
            u.username AS invited_by_name
     FROM staff_invitations si
     LEFT JOIN users u ON u.id = si.invited_by
     WHERE si.journal_id = $1
     ORDER BY si.created_at DESC`,
    [journal_id],
  );
  return result.rows;
};

export const expirePendingInvitations = async () => {
  const result = await pool.query(
    `UPDATE staff_invitations
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()
     RETURNING id, email, name, role, journal_id, invited_by`,
  );
  return result.rows;
};

export const hasPendingInvitation = async (
  email: string,
  role: string,
  journal_id: string,
) => {
  const result = await pool.query(
    `SELECT id FROM staff_invitations
     WHERE email = $1 AND role = $2 AND journal_id = $3 AND status = 'pending'`,
    [email, role, journal_id],
  );
  return result.rows.length > 0;
};
export const InvitationRepository = {
  // Find an expired invitation by email and journal
  findExpired: async (email: string, journal_id: string, role: string) => {
    const query = `
      SELECT * FROM staff_invitations 
      WHERE email = $1 AND journal_id = $2 AND role = $3 AND status = 'expired'
      LIMIT 1;
    `;
    const result = await pool.query(query, [email, journal_id, role]);
    return result.rows[0];
  },

  // Update invitation with new token and 7-day expiry
  updateForResend: async (id: string, newToken: string) => {
    const query = `
      UPDATE staff_invitations 
      SET token = $1, 
          status = 'pending', 
          expires_at = NOW() + INTERVAL '7 days',
          created_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [newToken, id]);
    return result.rows[0];
  },
};
// Find an invitation that has expired
export const findExpiredInvitation = async (
  email: string,
  role: string,
  journal_id: string,
) => {
  const result = await pool.query(
    `SELECT id FROM staff_invitations 
     WHERE email = $1 AND role = $2 AND journal_id = $3 AND status = 'expired'`,
    [email, role, journal_id],
  );
  return result.rows[0];
};

// Update the invitation with a new token and reset expiry to 7 days
export const updateInvitationForResend = async (
  id: string,
  newToken: string,
) => {
  const update = await pool.query(
    `UPDATE staff_invitations 
     SET token = $1, status = 'pending', expires_at = NOW() + INTERVAL '7 days', created_at = NOW()
     WHERE id = $2 RETURNING expires_at`,
    [newToken, id],
  );
  return update.rows[0];
};

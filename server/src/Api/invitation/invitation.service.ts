import bcrypt from "bcryptjs";
import { pool } from "../../configs/db";
import { env } from "../../configs/envs";
import { generateAccessToken } from "../../utils/jwt";
import { getUserRoles, insertUserRole } from "../auth/auth.repository";
import { createUser, createUserProfile } from "../auth/auth.service";
import {
  createInvitation,
  findInvitationByToken,
  findInvitationById,
  markInvitationAccepted,
  markInvitationCancelled,
  hasPendingInvitation,
  updateInvitationForResend,
  findExpiredInvitation,
} from "./invitation.repository";
import { sendInvitationEmail } from "../../utils/emails/userEmails";
import { sendWelcomeEmail } from "../../utils/emails/userEmails";

const ALLOWED_ROLES = [
  "chief_editor",
  "journal_manager",
  "sub_editor",
  "reviewer",
];

export const sendInvitationService = async (
  inviter: { id: string; role: string; username: string },
  data: {
    name: string;
    email: string;
    role: string;
    journal_id: string;
    paper_id?: string;
  },
) => {
  if (!ALLOWED_ROLES.includes(data.role)) {
    throw new Error("Invalid role. Cannot invite publisher or owner.");
  }

  // Check if user with this email already has this role for this journal
  const existing = await pool.query(
    `SELECT u.id FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     WHERE u.email = $1 AND ur.role = $2 AND ur.journal_id = $3 AND ur.is_active = true`,
    [data.email, data.role, data.journal_id],
  );
  if (existing.rows.length) {
    throw new Error(
      "This person is already assigned this role for the journal.",
    );
  }

  // For chief_editor: check if one already accepted
  if (data.role === "chief_editor") {
    const ceExists = await pool.query(
      `SELECT id FROM user_roles WHERE role = 'chief_editor' AND journal_id = $1 AND is_active = true`,
      [data.journal_id],
    );
    if (ceExists.rows.length) {
      throw new Error(
        "This journal already has a chief editor. Remove them first to invite a new one.",
      );
    }

    const pendingCE = await hasPendingInvitation(
      data.email,
      "chief_editor",
      data.journal_id,
    );
    if (!pendingCE) {
      // Check if ANY pending CE invitation exists for this journal (not just this email)
      const anyPending = await pool.query(
        `SELECT id FROM staff_invitations WHERE role = 'chief_editor' AND journal_id = $1 AND status = 'pending'`,
        [data.journal_id],
      );
      if (anyPending.rows.length) {
        throw new Error(
          "An invitation for chief editor is already pending for this journal. Cancel it first or wait for it to expire.",
        );
      }
    }
  }

  const journalRes = await pool.query(
    `SELECT title FROM journals WHERE id = $1`,
    [data.journal_id],
  );
  if (!journalRes.rows.length) throw new Error("Journal not found");
  const journalName = journalRes.rows[0].title;

  const invitation = await createInvitation({
    ...data,
    invited_by: inviter.id,
  });

  const acceptLink = `${env.FRONTEND_URL}/accept-invitation?token=${invitation.token}`;

  sendInvitationEmail({
    to: data.email,
    name: data.name,
    invitedByName: inviter.username,
    journalName,
    role: data.role,
    expiresAt: invitation.expires_at,
    acceptLink,
  }).catch(console.error);

  return {
    message: "Invitation sent",
    invitation_id: invitation.id,
    expires_at: invitation.expires_at,
  };
};

export const verifyInvitationService = async (token: string) => {
  const inv = await findInvitationByToken(token);
  if (!inv)
    throw Object.assign(new Error("Invalid invitation link"), {
      statusCode: 404,
    });
  if (inv.status === "expired" || new Date(inv.expires_at) < new Date()) {
    throw Object.assign(new Error("This invitation has expired"), {
      statusCode: 410,
    });
  }
  if (inv.status === "accepted") {
    throw Object.assign(new Error("This invitation has already been used"), {
      statusCode: 400,
    });
  }
  if (inv.status === "cancelled") {
    throw Object.assign(new Error("This invitation has been cancelled"), {
      statusCode: 400,
    });
  }

  return {
    name: inv.name,
    email: inv.email,
    role: inv.role,
    journal_id: inv.journal_id,
    journal_name: inv.journal_name,
    invited_by_name: inv.invited_by_name,
    expires_at: inv.expires_at,
  };
};

export const acceptInvitationService = async (
  token: string,
  password: string,
) => {
  const inv = await findInvitationByToken(token);
  if (!inv)
    throw Object.assign(new Error("Invalid invitation link"), {
      statusCode: 404,
    });
  if (inv.status === "expired" || new Date(inv.expires_at) < new Date()) {
    throw Object.assign(new Error("This invitation has expired"), {
      statusCode: 410,
    });
  }
  if (inv.status !== "pending") {
    throw Object.assign(new Error("This invitation is no longer valid"), {
      statusCode: 400,
    });
  }

  const hashed = await bcrypt.hash(password, env.SALT_ROUND || 10);

  // Check if user already exists
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [inv.email],
  );

  let userId: string;
  let userRole: string = inv.role;

  if (existingUser.rows.length) {
    // User exists — just add the new role
    userId = existingUser.rows[0].id;
  } else {
    // Create new user account
    const newUser = await createUser({
      email: inv.email,
      password: hashed,
      username: inv.name,
      role: inv.role,
    });
    await createUserProfile(newUser.id);
    userId = newUser.id;
  }

  // Add role in user_roles table
  await insertUserRole(userId, inv.role, inv.journal_id, inv.invited_by);

  // If chief_editor: update journals.chief_editor_id
  if (inv.role === "chief_editor" && inv.journal_id) {
    await pool.query(`UPDATE journals SET chief_editor_id = $1 WHERE id = $2`, [
      userId,
      inv.journal_id,
    ]);
  }

  // If paper_id: create the assignment
  if (inv.paper_id) {
    if (inv.role === "sub_editor") {
      await pool.query(
        `INSERT INTO editor_assignments (paper_id, sub_editor_id, assigned_by, assigned_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (paper_id)
         DO UPDATE SET sub_editor_id = EXCLUDED.sub_editor_id, assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()`,
        [inv.paper_id, userId, inv.invited_by],
      );
      await pool.query(
        `UPDATE papers SET status = 'assigned_to_sub_editor' WHERE id = $1 AND status NOT IN ('accepted','rejected','published')`,
        [inv.paper_id],
      );
    } else if (inv.role === "reviewer") {
      await pool.query(
        `INSERT INTO review_assignments (paper_id, reviewer_id, assigned_by, assigned_at, status)
         VALUES ($1, $2, $3, NOW(), 'assigned')
         ON CONFLICT (paper_id, reviewer_id) DO UPDATE SET status = 'assigned'`,
        [inv.paper_id, userId, inv.invited_by],
      );
      await pool.query(
        `UPDATE papers SET status = 'under_review' WHERE id = $1 AND status NOT IN ('accepted','rejected','published')`,
        [inv.paper_id],
      );
    }
  }

  // Mark invitation as accepted
  await markInvitationAccepted(inv.id);

  // Send welcome confirmation email
  sendWelcomeEmail(inv.email, inv.name, "").catch(console.error);

  // Generate JWT so user is logged in immediately
  const userRow = await pool.query(`SELECT * FROM users WHERE id = $1`, [
    userId,
  ]);
  const user = userRow.rows[0];

  // Collect all roles for this user so the token carries them all
  const userRoleRows = await getUserRoles(userId);
  const allRoles = userRoleRows.map((r) => r.role);
  if (!allRoles.includes(user.role)) allRoles.unshift(user.role);

  const accessToken = await generateAccessToken(
    user.id,
    user.role,
    user.email,
    user.username,
    allRoles,
    inv.role,
    inv.journal_id ?? null,
  );

  return {
    token: accessToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    journal_name: inv.journal_name,
    role: inv.role,
  };
};

export const cancelInvitationService = async (
  invitationId: string,
  requesterId: string,
  requesterRole: string,
) => {
  const inv = await findInvitationById(invitationId);
  if (!inv) throw new Error("Invitation not found");

  if (
    inv.invited_by !== requesterId &&
    requesterRole !== "publisher" &&
    requesterRole !== "owner"
  ) {
    throw new Error("Not authorised to cancel this invitation");
  }

  await markInvitationCancelled(invitationId);
  return { message: "Invitation cancelled" };
};

export const getJournalInvitationsService = async (journal_id: string) => {
  const { getInvitationsForJournal } =
    await import("./invitation.repository.js");
  return getInvitationsForJournal(journal_id);
};

import crypto from "crypto";

export const resendInvitationService = async (
  email: string,
  role: string,
  journal_id: string,
  title: string,
  username: string,
  cheifEditorName: string,
) => {
  // 1. Check if an expired invitation actually exists
  const inv = await findExpiredInvitation(email, role, journal_id);
  if (!inv) throw new Error("No expired invitation found to resend");

  // 2. Generate a new secure hex token
  const newToken = crypto.randomBytes(32).toString("hex");

  // 3. Update the database
  const newInv = await updateInvitationForResend(inv.id, newToken);

  const acceptLink = `${env.FRONTEND_URL}/accept-invitation?token=${newToken}`;

  sendInvitationEmail({
    to: email,
    name: cheifEditorName,
    invitedByName: username,
    journalName: title,
    role,
    expiresAt: newInv.expires_at,
    acceptLink,
  }).catch(console.error);

  return { message: "Invitation resent successfully" };
};

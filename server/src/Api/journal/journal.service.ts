import { pool } from "../../configs/db";
import {
  createJournal,
  getOwnerJournals,
  findJournals,
  findJournalById,
  updateJournalById,
  delteJournalById,
  createJournalByPublisher,
  findEditorialBoard,
} from "./journal.repository";
import { insertUserRole } from "../auth/auth.repository";
import { sendInvitationEmail } from "../../utils/emails/userEmails";
import { createInvitation } from "../invitation/invitation.repository";
import { env } from "../../configs/envs";

export type Journal = {
  title: string;
  acronym: string;
  description?: string;
  issn?: string;
  website_url?: string;
  chief_editor_id: string;
};

const SKIP_WORDS = new Set(['of', 'the', 'and', 'for', 'in', 'a', 'an']);

function buildAcronym(title: string): string {
  const letters = title
    .split(/\s+/)
    .filter((w) => w.length > 0 && !SKIP_WORDS.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join('');
  return letters || title.slice(0, 3).toUpperCase();
}

async function getUniqueAcronym(base: string): Promise<string> {
  const check = await pool.query('SELECT 1 FROM journals WHERE acronym = $1', [base]);
  if (!check.rows.length) return base;
  for (let n = 2; n <= 99; n++) {
    const candidate = `${base}${n}`;
    const r = await pool.query('SELECT 1 FROM journals WHERE acronym = $1', [candidate]);
    if (!r.rows.length) return candidate;
  }
  return `${base}${Date.now()}`;
}

export type PublisherJournalData = {
  title: string;
  acronym?: string;
  issn?: string;
  doi?: string | null;
  publisher_name: string;
  type: string;
  peer_review_policy: string;
  oa_policy: string;
  author_guidelines: string;
  aims_and_scope?: string | null;
  publication_fee?: number | null;
  currency?: string | null;
  logo_url?: string | null;
};


export const addJournalService = async (
  user: { id: string; role: string },
  data: Journal,
) => {
  try {
    if (user.role !== "owner") {
      throw new Error("Only owners can create journals");
    }

    if (!data.title || !data.acronym) {
      throw new Error("Journal title and acronym are required");
    }

    if (!data.chief_editor_id) {
      throw new Error("Chief Editor must be selected");
    }

    const publisherCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'chief_editor'`,
      [data.chief_editor_id],
    );

    if (!publisherCheck.rowCount) {
      throw new Error("Invalid chief editor selected");
    }

    return await createJournal(user.id, data);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      throw new Error(error.message || "Failed to create journal!");
    }
  }
};

export const getOwnerJournalService = async (user: {
  id: string;
  role: string;
}) => {
  try {
    if (user.role !== "owner") {
      throw new Error("Only owners can access journals");
    }

    return await getOwnerJournals(user.id);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      throw new Error(error.message || "Failed to find journals!");
    }
  }
};

export const getJournalsService = async () => {
  try {
    const result = await findJournals();
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to find journals!");
  }
};

export const getJournalService = async (id: string) => {
  try {
    const result = await findJournalById(id);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to find journal!");
  }
};

export const updateJournalService = async (id: string, data: Journal) => {
  try {
    const result = await updateJournalById(id, data);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to update journal!");
  }
};

export const deleteJournalService = async (id: string) => {
  try {
    const result = await delteJournalById(id);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to delete journal!");
  }
};

export const updateJournalLogoService = async (id: string, logo_url: string) => {
  const { pool } = await import("../../configs/db");
  await pool.query("UPDATE journals SET logo_url = $1 WHERE id = $2", [logo_url, id]);
};

export const getEditorialBoardService = async (journalId: string) => {
  return findEditorialBoard(journalId);
};

export const publisherCreateJournalService = async (
  publisherId: string,
  publisherName: string,
  data: PublisherJournalData & {
    chief_editor: { name: string; email: string };
    journal_manager: { name: string; email: string };
  },
) => {
  // Uniqueness checks for ISSN and DOI
  if (data.issn) {
    const issnCheck = await pool.query(
      `SELECT 1 FROM journals WHERE issn = $1`,
      [data.issn]
    );
    if (issnCheck.rows.length) {
      const err: any = new Error("A journal with this ISSN already exists");
      err.field = "issn";
      throw err;
    }
  }
  if (data.doi) {
    const doiCheck = await pool.query(
      `SELECT 1 FROM journals WHERE doi = $1`,
      [data.doi]
    );
    if (doiCheck.rows.length) {
      const err: any = new Error("A journal with this DOI already exists");
      err.field = "doi";
      throw err;
    }
  }

  // Auto-generate acronym from title if not provided
  if (!data.acronym) {
    const base = buildAcronym(data.title);
    data.acronym = await getUniqueAcronym(base);
  }

  // Create journal with null chief_editor_id — CE will be linked when they accept invitation
  const journal = await createJournalByPublisher(publisherId, null, data);

  // Grant publisher their journal_manager role for this journal
  await insertUserRole(publisherId, "journal_manager", journal.id, publisherId);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const frontendUrl = env.FRONTEND_URL;

  // Create CE invitation
  const ceInvitation = await createInvitation({
    email: data.chief_editor.email,
    name: data.chief_editor.name,
    role: "chief_editor",
    journal_id: journal.id,
    invited_by: publisherId,
  });

  // Create JM invitation
  const jmInvitation = await createInvitation({
    email: data.journal_manager.email,
    name: data.journal_manager.name,
    role: "journal_manager",
    journal_id: journal.id,
    invited_by: publisherId,
  });

  // Send invitation emails (fire-and-forget)
  sendInvitationEmail({
    to: data.chief_editor.email,
    name: data.chief_editor.name,
    invitedByName: publisherName,
    journalName: journal.title,
    role: "chief_editor",
    expiresAt,
    acceptLink: `${frontendUrl}/accept-invitation?token=${ceInvitation.token}`,
  }).catch(console.error);

  sendInvitationEmail({
    to: data.journal_manager.email,
    name: data.journal_manager.name,
    invitedByName: publisherName,
    journalName: journal.title,
    role: "journal_manager",
    expiresAt,
    acceptLink: `${frontendUrl}/accept-invitation?token=${jmInvitation.token}`,
  }).catch(console.error);

  return journal;
};

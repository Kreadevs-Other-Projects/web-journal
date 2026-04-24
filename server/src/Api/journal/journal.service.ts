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
  updateJournalAPC,
  updateJournalByPublisher,
} from "./journal.repository";
import { insertUserRole } from "../auth/auth.repository";
import { sendInvitationEmail } from "../../utils/emails/userEmails";
import { createInvitation } from "../invitation/invitation.repository";
import { env } from "../../configs/envs";

function sanitizeHtml(
  html: string | undefined | null,
): string | undefined | null {
  if (!html) return html;
  return html
    .replace(/\s+data-path-to-node="[^"]*"/g, "")
    .replace(/\s+data-index-in-node="[^"]*"/g, "");
}

export type Journal = {
  title: string;
  acronym: string;
  description?: string;
  issn?: string;
  website_url?: string;
  chief_editor_id: string;
};

const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "in",
  "for",
  "on",
  "at",
  "to",
  "a",
  "an",
  "by",
  "with",
  "de",
  "journal",
]);

function generateAcronym(title: string): string {
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w.toLowerCase()));

  let acronym = "";

  if (words.length >= 4) {
    acronym = words
      .slice(0, 4)
      .map((w) => w[0].toUpperCase())
      .join("");
  } else if (words.length === 3) {
    acronym = words.map((w) => w[0].toUpperCase()).join("");
    const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));
    acronym += (longest[1] ?? longest[0]).toUpperCase();
  } else if (words.length === 2) {
    acronym = words.map((w) => w.slice(0, 2).toUpperCase()).join("");
  } else if (words.length === 1) {
    acronym = words[0].slice(0, 4).toUpperCase();
  } else {
    const clean = title.replace(/\s/g, "").replace(/[^a-zA-Z]/g, "");
    acronym = clean.slice(0, 4).toUpperCase();
  }

  // Ensure exactly 4 characters
  if (acronym.length > 4) acronym = acronym.slice(0, 4);
  if (acronym.length < 4) {
    const firstWord = words[0] ?? title.replace(/\s/g, "");
    while (acronym.length < 4) {
      const nextChar =
        firstWord[acronym.length] ?? firstWord[firstWord.length - 1];
      acronym += nextChar.toUpperCase();
    }
  }

  return acronym;
}

async function getUniqueAcronym(base: string): Promise<string> {
  const check = await pool.query("SELECT 1 FROM journals WHERE acronym = $1", [
    base,
  ]);
  if (!check.rows.length) return base;

  for (let n = 1; n <= 9; n++) {
    const candidate = base.slice(0, 3) + n;
    const r = await pool.query("SELECT 1 FROM journals WHERE acronym = $1", [
      candidate,
    ]);
    if (!r.rows.length) return candidate;
  }
  for (let n = 10; n <= 99; n++) {
    const candidate = base.slice(0, 2) + String(n);
    const r = await pool.query("SELECT 1 FROM journals WHERE acronym = $1", [
      candidate,
    ]);
    if (!r.rows.length) return candidate;
  }
  return base.slice(0, 2) + Date.now().toString().slice(-2);
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
  journal_category_id?: string | null;
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

export const updateJournalLogoService = async (
  id: string,
  logo_url: string,
) => {
  await pool.query("UPDATE journals SET logo_url = $1 WHERE id = $2", [
    logo_url,
    id,
  ]);
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
      [data.issn],
    );
    if (issnCheck.rows.length) {
      const err: any = new Error("A journal with this ISSN already exists");
      err.field = "issn";
      throw err;
    }
  }
  if (data.doi) {
    const doiCheck = await pool.query(`SELECT 1 FROM journals WHERE doi = $1`, [
      data.doi,
    ]);
    if (doiCheck.rows.length) {
      const err: any = new Error("A journal with this DOI already exists");
      err.field = "doi";
      throw err;
    }
  }

  // Strip Quill editor artifacts from rich text fields
  data.peer_review_policy = sanitizeHtml(data.peer_review_policy) as string;
  data.oa_policy = sanitizeHtml(data.oa_policy) as string;
  data.author_guidelines = sanitizeHtml(data.author_guidelines) as string;
  data.aims_and_scope = sanitizeHtml(data.aims_and_scope);

  // Auto-generate 4-character acronym from title
  const base = generateAcronym(data.title);
  data.acronym = await getUniqueAcronym(base);

  // Create journal with null chief_editor_id — CE will be linked when they accept invitation
  const journal = await createJournalByPublisher(publisherId, null, data);

  // Auto-create first issue (Vol 1, Issue 1) as draft
  await pool.query(
    `INSERT INTO journal_issues (journal_id, volume, issue, year, label, status, article_index)
     VALUES ($1, 1, 1, $2, 'Vol 1, Issue 1', 'draft', 1)`,
    [journal.id, new Date().getFullYear()],
  );

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

export const updatePublisherJournalService = async (
  journalId: string,
  publisherId: string,
  data: Partial<PublisherJournalData>,
) => {
  const journal = await findJournalById(journalId);
  if (!journal) throw new Error("Journal not found");
  if (journal.owner_id !== publisherId) throw new Error("Access denied");

  // ISSN uniqueness check (exclude current journal)
  if (data.issn && data.issn !== journal.issn) {
    const check = await pool.query(
      `SELECT 1 FROM journals WHERE issn = $1 AND id != $2`,
      [data.issn, journalId],
    );
    if (check.rows.length) {
      const err: any = new Error("A journal with this ISSN already exists");
      err.field = "issn";
      throw err;
    }
  }

  // DOI uniqueness check (exclude current journal)
  if (data.doi && data.doi !== journal.doi) {
    const check = await pool.query(
      `SELECT 1 FROM journals WHERE doi = $1 AND id != $2`,
      [data.doi, journalId],
    );
    if (check.rows.length) {
      const err: any = new Error("A journal with this DOI already exists");
      err.field = "doi";
      throw err;
    }
  }

  // Clear ISSN/DOI if explicitly set to empty string
  if (data.issn === "") data.issn = undefined;
  if (data.doi === "") data.doi = undefined;

  // Strip Quill editor artifacts from rich text fields
  if (data.peer_review_policy)
    data.peer_review_policy = sanitizeHtml(data.peer_review_policy) as string;
  if (data.oa_policy) data.oa_policy = sanitizeHtml(data.oa_policy) as string;
  if (data.author_guidelines)
    data.author_guidelines = sanitizeHtml(data.author_guidelines) as string;
  if (data.aims_and_scope)
    data.aims_and_scope = sanitizeHtml(data.aims_and_scope);

  return updateJournalByPublisher(journalId, data);
};

const VALID_CURRENCIES = ["USD", "PKR", "EUR", "GBP"];

export const updateJournalAPCService = async (
  journalId: string,
  ownerId: string,
  fee: number,
  currency: string,
) => {
  if (fee < 0) throw new Error("Fee must be >= 0");
  if (!VALID_CURRENCIES.includes(currency))
    throw new Error(`Currency must be one of: ${VALID_CURRENCIES.join(", ")}`);
  const journal = await findJournalById(journalId);
  if (!journal) throw new Error("Journal not found");
  if (journal.owner_id !== ownerId) throw new Error("Access denied");
  return updateJournalAPC(journalId, fee, currency);
};

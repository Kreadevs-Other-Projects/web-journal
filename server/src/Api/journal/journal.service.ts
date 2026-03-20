import { pool } from "../../configs/db";
import bcrypt from "bcrypt";
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
import {
  createUser as createUserInDB,
  createUserProfile as createUserProfileInDB,
} from "../profile/profile.repository";
import { insertUserRole } from "../auth/auth.repository";
import { sendWelcomeEmail } from "../../utils/emails/userEmails";
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
  data: PublisherJournalData & {
    chief_editor: { name: string; email: string; password: string };
    journal_manager: { name: string; email: string; password: string };
  },
) => {
  // Auto-generate acronym from title if not provided
  if (!data.acronym) {
    const base = buildAcronym(data.title);
    data.acronym = await getUniqueAcronym(base);
  }

  const existingCE = await pool.query(
    "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
    [data.chief_editor.email],
  );
  if (existingCE.rowCount) {
    throw new Error("Chief editor email is already in use");
  }

  const existingJM = await pool.query(
    "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
    [data.journal_manager.email],
  );
  if (existingJM.rowCount) {
    throw new Error("Journal manager email is already in use");
  }

  const saltRounds = Number(env.SALT_ROUND) || 10;

  const ceHashedPwd = await bcrypt.hash(data.chief_editor.password, saltRounds);
  const ceUser = await createUserInDB({
    email: data.chief_editor.email,
    password: ceHashedPwd,
    username: data.chief_editor.name,
    role: "chief_editor",
  });
  await createUserProfileInDB(ceUser.id);

  const jmHashedPwd = await bcrypt.hash(
    data.journal_manager.password,
    saltRounds,
  );
  const jmUser = await createUserInDB({
    email: data.journal_manager.email,
    password: jmHashedPwd,
    username: data.journal_manager.name,
    role: "journal_manager",
  });
  await createUserProfileInDB(jmUser.id);

  const journal = await createJournalByPublisher(
    publisherId,
    ceUser.id,
    data,
  );

  await insertUserRole(ceUser.id, "chief_editor", journal.id, publisherId);
  await insertUserRole(jmUser.id, "journal_manager", journal.id, publisherId);
  await insertUserRole(publisherId, "journal_manager", journal.id, publisherId);

  sendWelcomeEmail(
    data.chief_editor.email,
    data.chief_editor.name,
    data.chief_editor.password,
  ).catch(console.error);

  sendWelcomeEmail(
    data.journal_manager.email,
    data.journal_manager.name,
    data.journal_manager.password,
  ).catch(console.error);

  return journal;
};

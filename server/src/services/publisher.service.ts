import {
  createJournal,
  getOwnerJournals,
} from "../repositories/publisher.repository";

export type Journal = {
  name: string;
  slug: string;
  description?: string;
  issn?: string;
  website_url?: string;
};

export const addJournalService = async (
  user: { id: string; role: string },
  data: Journal,
) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can create journals");
  }

  if (!data.name || !data.slug) {
    throw new Error("Journal name and slug are required");
  }

  return await createJournal(user.id, data);
};

export const getOwnerJournalService = async (user: {
  id: string;
  role: string;
}) => {
  if (user.role !== "owner") {
    throw new Error("Only owners can access journals");
  }

  return await getOwnerJournals(user.id);
};

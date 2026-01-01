import {
  findJournals,
  findJournalById,
  updateJournalById,
  delteJournalById,
} from "../repositories/journal.repository";

export type Journal = {
  name: string;
  slug: string;
  description?: string;
  issn?: string;
  website_url?: string;
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

export const updateJournalService = async (
  publisher_id: string,
  data: Journal
) => {
  try {
    const result = await updateJournalById(publisher_id, data);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to update journal!");
  }
};

export const deleteJournalService = async (publisher_id: string) => {
  try {
    const result = await delteJournalById(publisher_id);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to delete journal!");
  }
};

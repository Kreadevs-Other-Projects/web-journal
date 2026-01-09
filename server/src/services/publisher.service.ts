import {
  createJournal,
  getPublisherJorunal,
} from "../repositories/publisher.repository";

export type Journal = {
  name: string;
  slug: string;
  description?: string;
  issn?: string;
  website_url?: string;
};

export const addJournalService = async (
  publisher_id: string,
  data: Journal
) => {
  try {
    const result = await createJournal(publisher_id, data);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to create journal!");
  }
};

export const getPublisherJournalService = async (publisher_id: string) => {
  try {
    const result = await getPublisherJorunal(publisher_id);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to find journal!");
  }
};

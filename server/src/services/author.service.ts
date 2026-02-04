import { getJournals } from "../repositories/author.repository";

export const getJournalsService = async () => {
  try {
    const result = await getJournals();
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to get journals!");
  }
};

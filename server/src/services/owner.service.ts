import { getAllPublishers } from "../repositories/owner.reository";

export const fetchPublishers = async () => {
  return getAllPublishers();
};

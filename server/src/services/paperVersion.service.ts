import {
  createPaperVersion,
  getPaperVersions,
  getAllPaperVersions,
} from "../repositories/paperVersion.repository";
import { setCurrentVersion } from "../repositories/paper.repository";

export const uploadPaperVersionService = async (
  user: { id: string; role: string },
  paper_id: string,
  data: any,
) => {
  if (user.role !== "author") {
    throw new Error("Only author can upload versions");
  }

  const version = await createPaperVersion(paper_id, user.id, data);

  await setCurrentVersion(paper_id, version.id);

  return version;
};

export const getPaperVersionsService = async (paper_id: string) => {
  return await getPaperVersions(paper_id);
};

export const getAllPaperVersionsService = async () => {
  return await getAllPaperVersions();
};

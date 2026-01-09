import {
  createPaperVersionRepo,
  getPaperVersionsRepo,
} from "../repositories/paperVersion.repository";
import { updateCurrentVersion } from "../repositories/paper.repository";

export const createPaperVersionService = async (data: any, userId: string) => {
  const version = await createPaperVersionRepo(data, userId);

  await updateCurrentVersion(data.paper_id, version.id);

  return version;
};

export const getPaperVersionsService = async (paperId: string) => {
  return getPaperVersionsRepo(paperId);
};

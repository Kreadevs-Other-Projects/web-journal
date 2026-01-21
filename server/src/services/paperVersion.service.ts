import {
  createPaperVersion,
  getPaperVersions,
} from "../repositories/paperVersion.repository";
import {
  getPaperById,
  setCurrentVersion,
} from "../repositories/paper.repository";

export const uploadPaperVersionService = async (
  user: any,
  paper_id: string,
  data: any,
) => {
  if (user.role !== "author") {
    throw new Error("Only author can upload versions");
  }

  const paper = await getPaperById(paper_id);

  if (!paper) throw new Error("Paper not found");

  if (["accepted", "published", "rejected"].includes(paper.status)) {
    throw new Error("Cannot upload version for this paper status");
  }

  const version = await createPaperVersion(paper_id, user.id, data);

  await setCurrentVersion(paper_id, version.id);

  return version;
};

export const getPaperVersionsService = async (paper_id: string) =>
  getPaperVersions(paper_id);

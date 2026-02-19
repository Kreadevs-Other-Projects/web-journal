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
  data: {
    version_label: string;
    file_url: string;
    file_size: number;
    file_type: string;
  },
) => {
  if (user.role !== "author") {
    throw new Error("Only authors are allowed to upload paper versions.");
  }

  if (!paper_id) {
    throw new Error("Paper ID is required.");
  }

  const paper = await getPaperById(paper_id);
  if (!paper) {
    throw new Error("The requested paper was not found.");
  }

  if (["accepted", "published"].includes(paper.status)) {
    throw new Error(
      "This paper has already been finalized. You cannot upload new versions.",
    );
  }

  if (paper.status === "rejected") {
    throw new Error(
      "This paper has been rejected. New versions cannot be uploaded.",
    );
  }

  const existingVersions = await getPaperVersions(paper_id);
  if (existingVersions.some((v) => v.version_label === data.version_label)) {
    throw new Error(
      `A version with label "${data.version_label}" already exists.`,
    );
  }

  const version = await createPaperVersion(paper_id, user.id, data);

  await setCurrentVersion(paper_id, version.id);

  return version;
};

export const getPaperVersionsService = async (paper_id: string) => {
  if (!paper_id) {
    throw new Error("Paper ID is required.");
  }

  return getPaperVersions(paper_id);
};

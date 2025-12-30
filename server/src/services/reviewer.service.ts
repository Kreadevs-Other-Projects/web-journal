import * as repository from "../repositories/reviewer.repository";

export const getReviewerProfileService = async (userId: string) => {
  const profile = await repository.getReviewerProfileByUserId(userId);
  if (!profile) throw new Error("Reviewer profile not found");
  return profile;
};

export const updateReviewerProfileService = async (
  userId: string,
  data: { certification?: string; qualifications?: string[] },
  qualifications: any[]
) => {
  const profile = await repository.getReviewerProfileByUserId(userId);
  if (!profile) throw new Error("Reviewer profile not found");

  return repository.updateReviewerProfile(
    userId,
    data.certification || profile.certification || "",
    data.qualifications || profile.qualifications || []
  );
};

export const softDeleteReviewerProfileService = async (userId: string) => {
  await repository.softDeleteReviewerProfile(userId);
};

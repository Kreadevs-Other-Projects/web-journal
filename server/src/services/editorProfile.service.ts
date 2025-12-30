import {
  getEditorProfileById,
  updateEditorProfileStatus,
  updateEditorProfileExpertise,
} from "../repositories/editor.repository";

export const approveEditorProfile = async (
  profileId: string,
  adminId: string
) => {
  const profile = await getEditorProfileById(profileId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const status: "accepted" = "accepted";
  await updateEditorProfileStatus(profileId, adminId, status);

  return { message: `Profile ${profileId} has been ${status}` };
};

export const updateExpertiseService = async (
  profileId: string,
  expertise: string[]
) => {
  const profile = await getEditorProfileById(profileId);
  if (!profile) throw new Error("Profile not found");

  const updatedProfile = await updateEditorProfileExpertise(
    profileId,
    expertise
  );
  return updatedProfile;
};

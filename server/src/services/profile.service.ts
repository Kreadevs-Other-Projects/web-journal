import {
  findUserById,
  findUserByEmail,
  findUserProfile,
  updateUser,
  updateUserProfile,
  softDeleteUser,
} from "../repositories/user.repository";

export const getFullProfile = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) return null;

  const profile = await findUserProfile(userId);

  return {
    user,
    profile: profile || {},
  };
};

export const updateProfileService = async (
  userId: string,
  userData: { username?: string; email?: string },
  profileData?: {
    qualifications?: string | null;
    expertise?: string[] | null;
    certifications?: string | null;
  }
) => {
  if (userData.email) {
    const existing = await findUserByEmail(userData.email);
    if (existing && existing.id !== userId) {
      throw new Error("EMAIL_EXISTS");
    }
  }

  let updatedUser = null;
  if (Object.keys(userData).length > 0) {
    updatedUser = await updateUser(userId, userData);
  }

  let updatedProfile = null;
  if (profileData && Object.keys(profileData).length > 0) {
    updatedProfile = await updateUserProfile(userId, profileData);
  }

  return {
    user: updatedUser,
    profile: updatedProfile,
  };
};

export const deleteProfile = async (userId: string) => {
  return softDeleteUser(userId);
};

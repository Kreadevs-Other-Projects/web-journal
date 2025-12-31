import * as UserRepo from "../repositories/user.repository";
import * as EditorRepo from "../repositories/editor.repository";
import * as ReviewerRepo from "../repositories/reviewer.repository";

export const getFullProfile = async (userId: string) => {
  const user = await UserRepo.findUserById(userId);
  if (!user) return null;

  let roleProfile = null;

  if (["chief-editor", "sub-editor"].includes(user.role)) {
    roleProfile = await EditorRepo.getEditorProfileById(userId);
  }

  if (user.role === "reviewer") {
    roleProfile = await ReviewerRepo.getReviewerProfileByUserId(userId);
  }

  return {
    user,
    role_profile: roleProfile,
  };
};

export const updateProfile = async (
  userId: string,
  data: { username?: string; email?: string }
) => {
  if (data.email) {
    const existing = await UserRepo.findUserByEmail(data.email);
    if (existing && existing.id !== userId) {
      throw new Error("EMAIL_EXISTS");
    }
  }

  return UserRepo.updateUser(userId, data);
};

export const deleteProfile = async (userId: string) => {
  return UserRepo.softDeleteUser(userId);
};

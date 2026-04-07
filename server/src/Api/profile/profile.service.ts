import {
  findUserById,
  findUserByEmail,
  findUserProfile,
  verifyUserPassword,
  updateUserPassword,
  updateUser,
  updateUserProfile,
  softDeleteUser,
  markProfileCompleted,
} from "./profile.repository";

export const getFullProfile = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) return null;

  const profile = await findUserProfile(userId);

  return {
    user,
    profile: profile || {},
  };
};

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const isValid = await verifyUserPassword(userId, oldPassword);
  if (!isValid) {
    throw new Error("INVALID_OLD_PASSWORD");
  }

  const updated = await updateUserPassword(userId, newPassword);

  return updated;
};

export const updateProfileService = async (
  userId: string,
  userData: { username?: string; email?: string },
  profileData?: {
    qualifications?: string | null;
    expertise?: string[] | null;
    certifications?: string | null;
    degrees?: string[] | null;
    keywords?: string[] | null;
    profile_pic_url?: string | null;
    bio?: string | null;
    organization_name?: string | null;
    website?: string | null;
  },
) => {
  if (profileData?.keywords && profileData.keywords.length > 5) {
    throw new Error("KEYWORDS_LIMIT_EXCEEDED");
  }
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

export const completeProfileService = async (
  userId: string,
  role: string,
  userData: { username?: string; profile_pic?: string },
  profileData: {
    affiliation?: string;
    bio?: string;
    degrees?: string[];
    keywords?: string[];
    organization_name?: string;
    website?: string;
    profile_pic_url?: string;
  },
) => {
  // Validate role-specific required fields
  const editorialRoles = ["chief_editor", "sub_editor", "reviewer"];
  if (editorialRoles.includes(role)) {
    if (!profileData.degrees || profileData.degrees.length === 0) {
      throw new Error("DEGREES_REQUIRED");
    }
    if (!profileData.keywords || profileData.keywords.length === 0) {
      throw new Error("KEYWORDS_REQUIRED");
    }
    if (!profileData.affiliation) {
      throw new Error("AFFILIATION_REQUIRED");
    }
  }
  if (role === "author" && !profileData.affiliation) {
    throw new Error("AFFILIATION_REQUIRED");
  }
  if (role === "publisher" && !profileData.organization_name) {
    throw new Error("ORGANIZATION_REQUIRED");
  }
  if (role === "journal_manager" && !profileData.affiliation) {
    throw new Error("AFFILIATION_REQUIRED");
  }
  if (profileData.keywords && profileData.keywords.length > 5) {
    throw new Error("KEYWORDS_LIMIT_EXCEEDED");
  }

  if (Object.keys(userData).length > 0) {
    await updateUser(userId, userData);
  }

  // Map affiliation → qualifications (existing column), organization_name → certifications as org field
  const profileUpdate: Record<string, any> = {};
  if (profileData.profile_pic_url) profileUpdate.profile_pic_url = profileData.profile_pic_url;
  if (profileData.degrees) profileUpdate.degrees = profileData.degrees;
  if (profileData.keywords) profileUpdate.keywords = profileData.keywords;
  if (profileData.affiliation) profileUpdate.qualifications = profileData.affiliation;
  if (profileData.bio) profileUpdate.bio = profileData.bio;
  if (profileData.organization_name) profileUpdate.organization_name = profileData.organization_name;
  if (profileData.website) profileUpdate.website = profileData.website;

  if (Object.keys(profileUpdate).length > 0) {
    await updateUserProfile(userId, profileUpdate);
  }

  await markProfileCompleted(userId);
};

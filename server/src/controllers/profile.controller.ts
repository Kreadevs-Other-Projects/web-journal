import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  getFullProfile,
  updateProfileService,
  deleteProfile,
  changePassword,
} from "../services/profile.service";
import { deleteAllUserRefreshTokens } from "../repositories/auth.repository";

export const getProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const profile = await getFullProfile(userId);

  if (!profile) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const profilePicUrl = profile.user.profile_pic
    ? `${baseUrl}${profile.user.profile_pic}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user.username}`;

  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      user: {
        ...profile.user,
        profile_pic: profilePicUrl,
      },
      profile: profile.profile,
    },
  });
};

export const changePasswordController = async (
  req: AuthUser,
  res: Response,
) => {
  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const updated = await changePassword(userId, oldPassword, newPassword);
    res.json({ message: "Password updated successfully", user: updated });
  } catch (error: any) {
    if (error.message === "INVALID_OLD_PASSWORD") {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const editProfile = async (req: AuthUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { username, email, qualifications, expertise, certifications } =
      req.body;

    const userData: {
      username?: string;
      email?: string;
      profile_pic?: string | null;
    } = {};

    if (username) userData.username = username;
    if (email) userData.email = email;

    if (req.file) {
      userData.profile_pic = `/api/uploads/${req.file.filename}`;
    }

    const profileData: {
      qualifications?: string | null;
      expertise?: string[] | null;
      certifications?: string | null;
    } = {};

    if (qualifications !== undefined)
      profileData.qualifications = qualifications;

    if (expertise !== undefined) {
      profileData.expertise =
        typeof expertise === "string" ? JSON.parse(expertise) : expertise;
    }

    if (certifications !== undefined)
      profileData.certifications = certifications;

    const updated = await updateProfileService(
      userId,
      userData,
      Object.keys(profileData).length ? profileData : undefined,
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updated.user,
      profile: updated.profile,
    });
  } catch (err: any) {
    if (err.message === "EMAIL_EXISTS") {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const removeProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    await deleteAllUserRefreshTokens(userId);

    const deleted = await deleteProfile(userId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete profile",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile deleted and all sessions revoked",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete profile",
    });
  }
};

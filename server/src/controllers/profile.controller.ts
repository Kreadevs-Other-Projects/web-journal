import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  getFullProfile,
  updateProfileService,
  deleteProfile,
} from "../services/profile.service";

export const getProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const profile = await getFullProfile(userId);

  if (!profile) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
};

export const editProfile = async (req: AuthUser, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { username, email, qualifications, expertise, certifications } =
      req.body;

    const userData: { username?: string; email?: string } = {};
    if (username) userData.username = username;
    if (email) userData.email = email;

    const profileData: {
      qualifications?: string | null;
      expertise?: string[] | null;
      certifications?: string | null;
    } = {};
    if (qualifications !== undefined)
      profileData.qualifications = qualifications;
    if (expertise !== undefined) profileData.expertise = expertise;
    if (certifications !== undefined)
      profileData.certifications = certifications;

    const updated = await updateProfileService(userId, userData, profileData);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updated.user,
      profile: updated.profile,
    });
  } catch (err: any) {
    if (err.message === "EMAIL_EXISTS") {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

export const removeProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const deleted = await deleteProfile(userId);

  if (!deleted) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete profile",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Profile deleted successfully",
  });
};

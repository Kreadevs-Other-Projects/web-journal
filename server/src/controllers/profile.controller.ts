import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import * as ProfileService from "../services/profile.service";

export const getProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const profile = await ProfileService.getFullProfile(userId);

  if (!profile) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
};

export const updateProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;
  const { username, email } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const updated = await ProfileService.updateProfile(userId, {
    username,
    email,
  });

  if (!updated) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updated,
  });
};

export const deleteProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const deleted = await ProfileService.deleteProfile(userId);

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

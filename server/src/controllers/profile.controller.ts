import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import * as ProfileService from "../services/profile.service";

export const getProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const user = await ProfileService.getUserProfile(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
    },
  });
};

export const updateProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;
  const { username, email } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (email) {
    const existingUser = await ProfileService.findUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: "Email already in use by another account",
      });
    }
  }

  const updatedUser = await ProfileService.updateUserProfile(userId, {
    username,
    email,
  });

  if (!updatedUser) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    },
  });
};

export const deleteProfile = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const deletedUser = await ProfileService.softDeleteUser(userId);

  if (!deletedUser) {
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

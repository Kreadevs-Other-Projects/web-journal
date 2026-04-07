import { Response } from "express";
import path from "path";
import fs from "fs";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  getFullProfile,
  updateProfileService,
  deleteProfile,
  changePassword,
  completeProfileService,
} from "./profile.service";
import {
  generateAccessToken,
  UserRoleContext,
} from "../../utils/jwt";
import { getUserRoles as getUserRolesService } from "../auth/auth.service";
import { deleteAllUserRefreshTokens } from "../auth/auth.repository";
import {
  createCertificationRepo,
  getCertificationsByUserRepo,
  getCertificationByIdRepo,
  deleteCertificationRepo,
  countCertificationsRepo,
  markProfileCompleted,
} from "./profile.repository";

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

    const {
      username,
      email,
      qualifications,
      expertise,
      certifications,
      degrees,
      keywords,
    } = req.body;

    const userData: {
      username?: string;
      email?: string;
      profile_pic?: string | null;
    } = {};

    if (username) userData.username = username;
    if (email) userData.email = email;

    let uploadedPicUrl: string | undefined;
    if (req.file) {
      uploadedPicUrl = `/api/uploads/${req.file.filename}`;
      userData.profile_pic = uploadedPicUrl;
    }

    const profileData: {
      qualifications?: string | null;
      expertise?: string[] | null;
      certifications?: string | null;
      degrees?: string[] | null;
      keywords?: string[] | null;
      profile_pic_url?: string | null;
    } = {};

    if (qualifications !== undefined)
      profileData.qualifications = qualifications;

    if (expertise !== undefined) {
      profileData.expertise =
        typeof expertise === "string" ? JSON.parse(expertise) : expertise;
    }

    if (certifications !== undefined)
      profileData.certifications = certifications;

    if (degrees !== undefined) {
      profileData.degrees =
        typeof degrees === "string" ? JSON.parse(degrees) : degrees;
    }

    if (keywords !== undefined) {
      const parsedKeywords =
        typeof keywords === "string" ? JSON.parse(keywords) : keywords;
      if (parsedKeywords.length > 5) {
        return res.status(400).json({
          success: false,
          message: "Maximum 5 keywords allowed",
        });
      }
      profileData.keywords = parsedKeywords;
    }

    if (uploadedPicUrl) {
      profileData.profile_pic_url = uploadedPicUrl;
    }

    const updated = await updateProfileService(
      userId,
      userData,
      Object.keys(profileData).length ? profileData : undefined,
    );

    // If user hasn't completed profile yet, check if minimum fields are now present
    // and mark them as complete automatically
    let newToken: string | undefined;
    if (!req.user!.profile_completed) {
      const fullProfile = await getFullProfile(userId);
      if (fullProfile) {
        const role = req.user!.role;
        const up = fullProfile.profile ?? {};
        const editorialRoles = ["chief_editor", "sub_editor", "reviewer"];
        let isComplete = false;
        if (editorialRoles.includes(role)) {
          isComplete = !!(up.qualifications && up.degrees?.length > 0 && up.keywords?.length > 0);
        } else if (role === "author" || role === "journal_manager") {
          isComplete = !!up.qualifications;
        } else if (role === "publisher") {
          isComplete = !!(up.organization_name);
        } else {
          isComplete = true;
        }
        if (isComplete) {
          await markProfileCompleted(userId);
          const userRoleRows = await getUserRolesService(userId, role);
          newToken = await generateAccessToken(
            userId, role, req.user!.email, req.user!.username,
            userRoleRows as UserRoleContext[], role, req.user!.active_journal_id, true,
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updated.user,
      profile: updated.profile,
      ...(newToken ? { token: newToken } : {}),
    });
  } catch (err: any) {
    if (err.message === "EMAIL_EXISTS") {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    if (err.message === "KEYWORDS_LIMIT_EXCEEDED") {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 keywords allowed",
      });
    }

    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const uploadCertification = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const count = await countCertificationsRepo(userId);
  if (count >= 5) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ success: false, message: "Maximum 5 certifications allowed" });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const fileUrl = `${baseUrl}/api/uploads/certifications/${req.file.filename}`;

  const cert = await createCertificationRepo({
    user_id: userId,
    file_url: fileUrl,
    file_name: req.file.originalname,
    file_type: req.file.mimetype,
  });

  return res.status(201).json({ success: true, certification: cert });
};

export const getCertifications = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const certs = await getCertificationsByUserRepo(userId);
  return res.json({ success: true, certifications: certs });
};

export const deleteCertification = async (req: AuthUser, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { certId } = req.params;
  const cert = await getCertificationByIdRepo(certId);
  if (!cert) return res.status(404).json({ success: false, message: "Certification not found" });
  if (cert.user_id !== userId) return res.status(403).json({ success: false, message: "Forbidden" });

  // Delete file from disk
  const filename = path.basename(cert.file_url);
  const filePath = path.join(process.cwd(), "uploads", "certifications", filename);
  fs.unlink(filePath, () => {});

  await deleteCertificationRepo(certId, userId);
  return res.json({ success: true, message: "Certification deleted" });
};

export const completeProfile = async (req: AuthUser, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { username, affiliation, bio, organization_name, website } = req.body;

    let degrees: string[] | undefined;
    if (req.body.degrees) {
      degrees = typeof req.body.degrees === "string"
        ? JSON.parse(req.body.degrees)
        : req.body.degrees;
    }

    let keywords: string[] | undefined;
    if (req.body.keywords) {
      keywords = typeof req.body.keywords === "string"
        ? JSON.parse(req.body.keywords)
        : req.body.keywords;
    }

    const userData: { username?: string; profile_pic?: string } = {};
    if (username) userData.username = username;

    const profileData: Record<string, any> = {};
    if (affiliation) profileData.affiliation = affiliation;
    if (bio) profileData.bio = bio;
    if (degrees) profileData.degrees = degrees;
    if (keywords) profileData.keywords = keywords;
    if (organization_name) profileData.organization_name = organization_name;
    if (website) profileData.website = website;

    if (req.file) {
      const picUrl = `/api/uploads/${req.file.filename}`;
      userData.profile_pic = picUrl;
      profileData.profile_pic_url = picUrl;
    }

    await completeProfileService(userId, role, userData, profileData);

    // Issue new token with profile_completed = true
    const userRoleRows = await getUserRolesService(userId, role);
    const newToken = await generateAccessToken(
      userId,
      role,
      req.user!.email,
      username || req.user!.username,
      userRoleRows as UserRoleContext[],
      req.user!.role,
      req.user!.active_journal_id,
      true,
    );

    return res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      token: newToken,
    });
  } catch (err: any) {
    const errorMap: Record<string, [number, string]> = {
      DEGREES_REQUIRED: [400, "At least one degree is required"],
      KEYWORDS_REQUIRED: [400, "At least one area of expertise is required"],
      AFFILIATION_REQUIRED: [400, "Affiliation / institution is required"],
      ORGANIZATION_REQUIRED: [400, "Organization name is required"],
      KEYWORDS_LIMIT_EXCEEDED: [400, "Maximum 5 keywords allowed"],
    };
    const [status, message] = errorMap[err.message] ?? [500, "Failed to complete profile"];
    return res.status(status).json({ success: false, message });
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

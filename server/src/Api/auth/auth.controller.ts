import { Request, Response } from "express";
import {
  findUserByEmail,
  findUserById,
  hashPassword,
  createUser,
  validatePassword,
  createUserProfile,
  getUserRoles,
} from "./auth.service";
import {
  createOTP,
  verifyOTP,
  checkOTPVerified,
  deleteOTP,
} from "../otp/otp.service";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../../utils/jwt";
import {
  deleteRefreshToken,
  findRefreshToken,
  saveRefreshToken,
  getUserRoles as getUserRolesRepo,
  insertUserRole,
  upsertAuthorRole,
} from "./auth.repository";
import { sendOTPEmail } from "../../utils/emails/authEmails";
import { env } from "../../configs/envs";

export const login = async (req: Request, res: Response) => {
  const { email, password, role, purpose } = req.body;

  if (!email || !password || !role || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email, password, role and purpose are required",
    });
  }

  if (!["login", "signup", "reset"].includes(purpose)) {
    return res.status(400).json({
      success: false,
      message: "Invalid purpose",
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found!",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Account is not active. Please contact support.",
    });
  }

  const isValid = await validatePassword(password, user.password);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid password!",
    });
  }

  // Validate the requested role exists for this user
  const userRoleRows = await getUserRoles(user.id, user.role);
  const requestedRole = role || user.role;
  const matchingUserRole = userRoleRows.find((r) => r.role === requestedRole);
  const hasPrimaryRole = user.role === requestedRole;

  if (!matchingUserRole && !hasPrimaryRole) {
    return res.status(403).json({
      success: false,
      message: `You are not registered as ${requestedRole.replace(/_/g, " ")}`,
    });
  }

  // Credentials valid — send OTP. JWT is issued only after OTP is verified via /auth/verifyLoginOTP
  const otpRecord = await createOTP(email, "login");
  await sendOTPEmail(email, otpRecord.otp_code);

  return res.status(200).json({
    success: true,
    requires_otp: true,
    message: "A verification code has been sent to your email",
  });
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, username, role } = req.body;

  const BLOCKED_ROLES = ["owner", "chief_editor", "sub_editor", "journal_manager"];
  if (BLOCKED_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  // Require OTP verification before creating any account
  const otpVerified = await checkOTPVerified(email);
  if (!otpVerified) {
    return res.status(400).json({
      success: false,
      message: "Email not verified. Please complete OTP verification.",
    });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    // Special case: existing user wants to add Author role — no new account needed
    if (role === "author") {
      await upsertAuthorRole(existingUser.id);

      const userRoleRows = await getUserRoles(existingUser.id, existingUser.role);

      const accessToken = await generateAccessToken(
        existingUser.id,
        existingUser.role,
        existingUser.email,
        existingUser.username,
        userRoleRows,
        "author",
        null,
      );

      await deleteOTP(email);

      return res.status(200).json({
        success: true,
        message: "Author role added to your existing account",
        token: accessToken,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          active_role: "author",
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: "An account with this email already exists. Please sign in instead.",
      errors: [
        {
          field: "email",
          message: "Email already registered. Sign in to your existing account.",
        },
      ],
    });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await createUser({
    email,
    password: hashedPassword,
    username,
    role,
  });

  await createUserProfile(newUser.id);

  // Add primary role to user_roles so multi-role system tracks it
  await insertUserRole(newUser.id, role, null, null);

  await deleteOTP(email);

  return res.status(201).json({ success: true, message: "Signup successful" });
};

export const verify = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const otpRecord = await verifyOTP(email, otp);

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
};

export const requestOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email and purpose are required",
    });
  }

  if (purpose !== "signup") {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }
  }

  const otp = await createOTP(email, purpose);

  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    expiresAt: otp.expiry_at,
  });
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, role: requestedRole } = req.body;

    const otpRecord = await verifyOTP(email, otp);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    await deleteOTP(email);

    const userRoleRows = await getUserRoles(user.id, user.role);

    // Use the role the user selected at login; fall back to primary role
    const activeRole = requestedRole || user.role;
    const matchingRow = userRoleRows.find((r) => r.role === activeRole);
    const activeJournalId = matchingRow?.journal_id ?? null;

    const accessToken = await generateAccessToken(
      user.id,
      user.role,
      user.email,
      user.username,
      userRoleRows,
      activeRole,
      activeJournalId,
    );
    const refreshToken = await generateRefreshToken(user.id, user.role);

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const savedTokenId = await saveRefreshToken(user.id, refreshToken, expires_at);
    if (!savedTokenId) {
      return res.status(500).json({
        success: false,
        message: "Failed to save refresh token",
      });
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        roles: userRoleRows.map((r) => r.role),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email",
    });
  }

  const otp = await createOTP(email, purpose);

  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP resent successfully to your email",
    expiresAt: otp.expiry_at,
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }

  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found or expired",
    });
  }

  const user = await findUserById(storedToken.user_id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const newAccessToken = await generateAccessToken(user.id, user.role);

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    token: newAccessToken,
  });
};

export const switchRole = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const { role, journal_id = null } = req.body;

    // Verify user has this role in user_roles table
    const userRoleRows = await getUserRolesRepo(payload.id);
    const primaryRole = payload.role;

    // Build the full set of roles (including primary) as structured objects.
    // Only add the primary as a generic null-journal entry if no user_roles row
    // exists for that role at all — avoids duplicates for journal-scoped roles.
    const allRoles = [...userRoleRows];
    if (!allRoles.some((r) => r.role === primaryRole)) {
      allRoles.unshift({ role: primaryRole, journal_id: null, journal_name: null });
    }

    // Deduplicate by role+journal_id
    const seenKeys = new Set<string>();
    const uniqueRoles = allRoles.filter((r) => {
      const key = `${r.role}-${r.journal_id ?? "null"}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    const hasRole = userRoleRows.some(
      (r) =>
        r.role === role &&
        (journal_id ? r.journal_id === journal_id : true),
    ) || role === primaryRole;

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "You do not have the requested role",
      });
    }

    const user = await findUserById(payload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Auto-discover journal_id from user_roles if client didn't provide one
    let effectiveJournalId = journal_id;
    if (!effectiveJournalId) {
      const matchingRow = userRoleRows.find((r) => r.role === role);
      effectiveJournalId = matchingRow?.journal_id ?? null;
    }

    const newToken = await generateAccessToken(
      user.id,
      user.role,
      user.email,
      user.username,
      uniqueRoles,
      role,
      effectiveJournalId,
    );

    return res.status(200).json({
      success: true,
      message: "Role switched successfully",
      token: newToken,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to switch role",
    });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  const { name, email, password, role, journal_id, keywords, degrees } = req.body;

  const BLOCKED = ["publisher", "owner"];
  if (BLOCKED.includes(role)) {
    return res.status(403).json({ success: false, message: "Cannot create this role via this endpoint" });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: "Email is already in use" });
  }

  const hashed = await hashPassword(password);
  const newUser = await createUser({ email, password: hashed, username: name, role });
  await createUserProfile(newUser.id);

  // Insert user_roles entry scoped to the journal
  const grantedBy = (req as any).user?.id ?? null;
  await insertUserRole(newUser.id, role, journal_id, grantedBy);

  return res.status(201).json({
    success: true,
    user: { id: newUser.id, email: newUser.email, role: newUser.role, username: newUser.username },
  });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const deletedId = await deleteRefreshToken(refreshToken);

  if (!deletedId) {
    return res.status(404).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

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
} from "./auth.repository";
import { sendOTPEmail } from "../../utils/emails/authEmails";
import { env } from "../../configs/envs";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: "Account not found!" });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Account is not active. Please contact support.",
    });
  }

  const isValid = await validatePassword(password, user.password);
  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid password!" });
  }

  // Fetch all roles with journal context
  const userRoleRows = await getUserRoles(user.id, user.role);

  const needsRoleSelection = userRoleRows.length > 1;

  // For single role: use it directly. For multiple: default to primary until user picks.
  const primaryEntry =
    userRoleRows.find((r) => r.role === user.role && r.journal_id === null) ??
    userRoleRows[0];

  const activeRole = needsRoleSelection ? user.role : (userRoleRows[0]?.role ?? user.role);
  const activeJournalId = needsRoleSelection
    ? (primaryEntry?.journal_id ?? null)
    : (userRoleRows[0]?.journal_id ?? null);
  const activeJournalName = needsRoleSelection
    ? (primaryEntry?.journal_name ?? null)
    : (userRoleRows[0]?.journal_name ?? null);

  const accessToken = await generateAccessToken(
    user.id,
    user.role,
    user.email,
    user.username,
    userRoleRows,
    activeRole,
    activeJournalId,
    activeJournalName,
  );
  const refreshToken = await generateRefreshToken(user.id, user.role);

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const savedTokenId = await saveRefreshToken(user.id, refreshToken, expires_at);
  if (!savedTokenId) {
    return res.status(500).json({ success: false, message: "Failed to save refresh token" });
  }

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: needsRoleSelection ? "Please select your active role" : "Login successful",
    token: accessToken,
    refreshToken,
    needs_role_selection: needsRoleSelection,
    active_role: activeRole,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      roles: userRoleRows,
    },
  });
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, username, role } = req.body;

  const BLOCKED_ROLES = ["owner", "chief_editor", "sub_editor", "journal_manager", "reviewer"];
  if (BLOCKED_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role. Use invitation link for editorial roles." });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: "User already exists" });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await createUser({ email, password: hashedPassword, username, role });
  await createUserProfile(newUser.id);

  // Seed user_roles so multi-role system works from first login
  await insertUserRole(newUser.id, role, null, newUser.id);

  await deleteOTP(email);

  return res.status(201).json({ success: true, message: "Signup successful" });
};

export const verify = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const otpRecord = await verifyOTP(email, otp);

  if (!otpRecord) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }

  return res.status(200).json({ success: true, message: "OTP verified successfully" });
};

export const requestOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).json({ success: false, message: "Email and purpose are required" });
  }

  if (purpose !== "signup") {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }
  }

  const otp = await createOTP(email, purpose);
  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({ success: true, message: "OTP sent successfully", expiresAt: otp.expiry_at });
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const otpRecord = await verifyOTP(email, otp);
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    await deleteOTP(email);

    const userRoleRows = await getUserRoles(user.id, user.role);
    const needsRoleSelection = userRoleRows.length > 1;
    const activeRole = userRoleRows[0]?.role ?? user.role;
    const activeJournalId = userRoleRows[0]?.journal_id ?? null;
    const activeJournalName = userRoleRows[0]?.journal_name ?? null;

    const accessToken = await generateAccessToken(
      user.id, user.role, user.email, user.username,
      userRoleRows, activeRole, activeJournalId, activeJournalName,
    );
    const refreshToken = await generateRefreshToken(user.id, user.role);

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const savedTokenId = await saveRefreshToken(user.id, refreshToken, expires_at);
    if (!savedTokenId) {
      return res.status(500).json({ success: false, message: "Failed to save refresh token" });
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: needsRoleSelection ? "Please select your active role" : "Login successful",
      token: accessToken,
      refreshToken,
      needs_role_selection: needsRoleSelection,
      active_role: activeRole,
      user: { id: user.id, email: user.email, role: user.role, username: user.username, roles: userRoleRows },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: "No account found with this email" });
  }

  const otp = await createOTP(email, purpose);
  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({ success: true, message: "OTP resent successfully to your email", expiresAt: otp.expiry_at });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token is required" });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }

  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken) {
    return res.status(401).json({ success: false, message: "Refresh token not found or expired" });
  }

  const user = await findUserById(storedToken.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Re-fetch all roles so the refreshed token has full role context
  const userRoleRows = await getUserRolesRepo(user.id);
  const fullRoles = userRoleRows.length > 0
    ? userRoleRows
    : [{ role: user.role, journal_id: null, journal_name: null }];

  const newAccessToken = await generateAccessToken(
    user.id, user.role, user.email, user.username,
    fullRoles, user.role, null, null,
  );

  return res.status(200).json({ success: true, message: "Token refreshed successfully", token: newAccessToken });
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

    // Fetch current roles with journal info
    const userRoleRows = await getUserRolesRepo(payload.id);

    // Ensure primary role is in the list
    const hasPrimary = userRoleRows.some((r) => r.role === payload.role && r.journal_id === null);
    if (!hasPrimary) {
      userRoleRows.unshift({ role: payload.role, journal_id: null, journal_name: null });
    }

    // Verify user actually has the requested role
    const matchingRole = userRoleRows.find(
      (r) =>
        r.role === role &&
        (journal_id
          ? r.journal_id === journal_id
          : r.journal_id === null || true), // if no journal_id specified, match first
    );

    // Also allow switching to primary role
    const hasPrimaryRole = role === payload.role;

    if (!matchingRole && !hasPrimaryRole) {
      return res.status(403).json({ success: false, message: "You do not have the requested role" });
    }

    const user = await findUserById(payload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Resolve effective journal context
    let effectiveJournalId = journal_id;
    let effectiveJournalName: string | null = null;
    if (!effectiveJournalId && matchingRole) {
      effectiveJournalId = matchingRole.journal_id ?? null;
      effectiveJournalName = matchingRole.journal_name ?? null;
    } else if (matchingRole) {
      effectiveJournalName = matchingRole.journal_name ?? null;
    }

    const newToken = await generateAccessToken(
      user.id,
      user.role,
      user.email,
      user.username,
      userRoleRows,
      role,
      effectiveJournalId,
      effectiveJournalName,
    );

    return res.status(200).json({ success: true, message: "Role switched successfully", token: newToken });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to switch role" });
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
    return res.status(400).json({ success: false, message: "Refresh token is required" });
  }

  const deletedId = await deleteRefreshToken(refreshToken);
  if (!deletedId) {
    return res.status(404).json({ success: false, message: "Refresh token not found" });
  }

  return res.status(200).json({ success: true, message: "Logout successful" });
};

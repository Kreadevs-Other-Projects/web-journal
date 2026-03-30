import bcrypt from "bcrypt";
import {
  findUserByEmail as findUserRepo,
  findUserById as findUserByIdRepo,
  createUser as createUserRepo,
  createUserProfile as createUserProfileRepo,
} from "../profile/profile.repository";
import { getUserRoles as getUserRolesRepo } from "./auth.repository";
import { env } from "../../configs/envs";

export const findUserByEmail = async (email: string) => {
  return await findUserRepo(email);
};

export const findUserById = async (userId: string) => {
  return await findUserByIdRepo(userId);
};

export const validatePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const hashPassword = async (password: string) => {
  const saltRounds = env.SALT_ROUND;
  return await bcrypt.hash(password, saltRounds);
};

export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
  role: string;
}) => {
  return await createUserRepo(userData);
};

export const createUserProfile = async (userId: string) => {
  return await createUserProfileRepo(userId);
};

/**
 * Returns all active roles for a user from the user_roles table.
 * Always includes the user's primary role from the users table.
 */
export const getUserRoles = async (
  userId: string,
  primaryRole: string,
): Promise<{ role: string; journal_id: string | null; journal_name: string | null }[]> => {
  const rows = await getUserRolesRepo(userId);

  // Ensure primary role is always present
  const hasPrimary = rows.some(
    (r) => r.role === primaryRole && r.journal_id === null,
  );

  if (!hasPrimary) {
    return [{ role: primaryRole, journal_id: null, journal_name: null }, ...rows];
  }

  return rows;
};

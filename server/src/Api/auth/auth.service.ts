import bcrypt from "bcrypt";
import {
  findUserByEmail as findUserRepo,
  findUserById as findUserByIdRepo,
  createUser as createUserRepo,
  createUserProfile as createUserProfileRepo,
} from "../profile/profile.repository";
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

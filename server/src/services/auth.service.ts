import bcrypt from "bcrypt";
import {
  findUserByEmail as findUserRepo,
  createUser as createUserRepo,
} from "../repositories/user.repository";
import { env } from "../configs/envs";

export const findUserByEmail = async (email: string) => {
  return await findUserRepo(email);
};

export const validatePassword = async (
  password: string,
  hashedPassword: string
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
}) => {
  return await createUserRepo(userData);
};

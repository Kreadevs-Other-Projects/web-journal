import bcrypt from "bcrypt";
import { findUserByEmail as findUserRepo } from "../repositories/user.repository";

export const findUserByEmail = async (email: string) => {
  return await findUserRepo(email);
};

export const validatePassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

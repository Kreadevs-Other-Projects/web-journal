import {
  findUserById as findUserByIdRepo,
  findUserByEmail as findUserByEmailRepo,
  updateUser as updateUserRepo,
  softDeleteUser as softDeleteUserRepo,
} from "../repositories/user.repository";

export const getUserProfile = async (userId: string) => {
  return await findUserByIdRepo(userId);
};

export const findUserByEmail = async (email: string) => {
  return await findUserByEmailRepo(email);
};

export const updateUserProfile = async (
  userId: string,
  data: { username?: string; email?: string }
) => {
  return await updateUserRepo(userId, data);
};

export const softDeleteUser = async (userId: string) => {
  return await softDeleteUserRepo(userId);
};

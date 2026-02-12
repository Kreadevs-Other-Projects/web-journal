import {
  createChiefEditor,
  getAllChiefEditors,
  getAllPublishers,
} from "../repositories/owner.reository";
import { generatePassword, hashPassword } from "../utils/password";

export const fetchPublishers = async () => {
  return getAllPublishers();
};

export const fetchChiefEditors = async () => {
  return getAllChiefEditors();
};

export const createChiefEditorService = async (
  username: string,
  email: string,
) => {
  const plainPassword = generatePassword();
  const hashedPassword = await hashPassword(plainPassword);

  const user = await createChiefEditor(username, email, hashedPassword);

  return {
    user,
    generatedPassword: plainPassword,
  };
};

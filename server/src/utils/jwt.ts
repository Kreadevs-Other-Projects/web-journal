import jwt from "jsonwebtoken";
import { env } from "../configs/envs";

export const generateAccessToken = async (userId: string) => {
  return jwt.sign(
    {
      userId,
    },
    env.JWT_SECRET,
    { expiresIn: (env.JWT_SHORT_EXPIRY as string) || "24h" }
  );
};

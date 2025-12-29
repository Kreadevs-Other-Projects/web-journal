import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  login,
  signup,
  refreshToken,
  logout,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  loginSchema,
  signupSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post("/signup", validate(signupSchema), asyncHandler(signup));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/token", validate(refreshTokenSchema), asyncHandler(refreshToken));
router.post("/logout", validate(logoutSchema), asyncHandler(logout));

export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  login,
  signup,
  requestOTP,
  verify,
  verifyLoginOTP,
  resendOTP,
  refreshToken,
  logout,
  switchRole,
  createStaff,
} from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import {
  loginSchema,
  signupSchema,
  createOTPSchema,
  verifyOTPSchema,
  resendOTPSchema,
  refreshTokenSchema,
  logoutSchema,
  switchRoleSchema,
  createStaffSchema,
} from "./auth.schema";

const router = Router();

router.post("/signup", validate(signupSchema), asyncHandler(signup));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/create", validate(createOTPSchema), asyncHandler(requestOTP));
router.post("/verifysignup", validate(verifyOTPSchema), asyncHandler(verify));
router.post(
  "/verifyLoginOTP",
  validate(verifyOTPSchema),
  asyncHandler(verifyLoginOTP),
);
router.post("/resend", validate(resendOTPSchema), asyncHandler(resendOTP));
router.post("/token", validate(refreshTokenSchema), asyncHandler(refreshToken));
router.post("/logout", validate(logoutSchema), asyncHandler(logout));
router.post("/switch-role", validate(switchRoleSchema), asyncHandler(switchRole));
router.post(
  "/create-staff",
  authMiddleware,
  authorize("chief_editor", "publisher", "journal_manager"),
  validate(createStaffSchema),
  asyncHandler(createStaff),
);

export default router;

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import {
  createOTP,
  verifyLoginOTP,
  resendOTP,
} from "../controllers/otp.controller";
import {
  createOTPSchema,
  verifyOTPSchema,
  resendOTPSchema,
} from "../schemas/otp.schema";

const router = Router();

router.post("/create", validate(createOTPSchema), asyncHandler(createOTP));
router.post("/verify", validate(verifyOTPSchema), asyncHandler(verifyLoginOTP));
router.post("/resend", validate(resendOTPSchema), asyncHandler(resendOTP));

export default router;

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { login, signup } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, signupSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/signup", validate(signupSchema), asyncHandler(signup));

export default router;

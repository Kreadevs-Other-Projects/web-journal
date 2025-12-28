import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { login, signup } from "../controllers/auth.controller";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/signup", asyncHandler(signup));

export default router;

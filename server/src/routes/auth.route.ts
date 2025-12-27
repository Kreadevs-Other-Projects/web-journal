import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { login } from "../controllers/auth.controller";

const router = Router();

router.post("/login", asyncHandler, login);

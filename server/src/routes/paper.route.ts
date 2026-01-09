import { Router } from "express";
import { paperController } from "../controllers/paper.controller";

const router = Router();

router.get("/", paperController.example);

export default router;

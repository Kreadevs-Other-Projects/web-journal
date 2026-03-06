import { Router } from "express";
import { getBrowseData } from "./browse.controller";

const router = Router();

router.get("/getBrowseData", getBrowseData);

export default router;

import { Router } from "express";
import { getBrowseData, getPublicPaper, getPaperHtml } from "./browse.controller";

const router = Router();

router.get("/getBrowseData", getBrowseData);
router.get("/paper/:paperId/html", getPaperHtml);
router.get("/paper/:paperId", getPublicPaper);

export default router;

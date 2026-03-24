import { Router } from "express";
import { getBrowseData, getPublicPaper, getPaperHtml, getHomeJournals, getHomePublications } from "./browse.controller";

const router = Router();

router.get("/getBrowseData", getBrowseData);
router.get("/home/journals", getHomeJournals);
router.get("/home/publications", getHomePublications);
router.get("/paper/:paperId/html", getPaperHtml);
router.get("/paper/:paperId", getPublicPaper);

export default router;

import { Router } from "express";
import {
  getBrowseData,
  getPublicPaper,
  getPaperHtml,
  getHomeJournals,
  getHomePublications,
  getOpenJournals,
  getPublicPaperBySlug,
  getPaperSlug,
} from "./browse.controller";

const router = Router();

router.get("/getBrowseData", getBrowseData);
router.get("/home/journals", getHomeJournals);
router.get("/home/publications", getHomePublications);
router.get("/home/open-journals", getOpenJournals);
// New: look up by journal acronym + url_slug
router.get("/article/:acronym/:slug", getPublicPaperBySlug);
// New: get acronym + url_slug by paper UUID (for ArticleRedirect)
router.get("/paper/:paperId/slug", getPaperSlug);
router.get("/paper/:paperId/html", getPaperHtml);
router.get("/paper/:paperId", getPublicPaper);

export default router;

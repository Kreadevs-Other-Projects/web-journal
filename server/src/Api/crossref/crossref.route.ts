import { Router } from "express";
import { lookupDOI, lookupJournal, getCitations } from "./crossref.controller";

const router = Router();

router.get("/doi", lookupDOI);           // GET /api/crossref/doi?doi=10.1000/xyz123
router.get("/journal/:issn", lookupJournal); // GET /api/crossref/journal/12345678
router.get("/citations", getCitations);  // GET /api/crossref/citations?doi=10.1000/xyz123

export default router;

import { Router } from "express";
import { getArchive, getArchiveFilters } from "./archive.controller";

const router = Router();

router.get("/", getArchive);
router.get("/filters", getArchiveFilters);

export default router;

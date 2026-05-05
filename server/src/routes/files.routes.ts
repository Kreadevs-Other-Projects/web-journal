import { Router, Request, Response } from "express";

const router = Router();

// Files are served via Supabase Storage CDN — local file serving is no longer supported.
router.get("/:filename", (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Local file serving has been removed. Files are served via Supabase Storage CDN.",
  });
});

export default router;

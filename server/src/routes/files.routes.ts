import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

const router = Router();

router.get("/:filename", (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), "uploads", filename);

    if (!filePath.startsWith(path.join(process.cwd(), "uploads"))) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const ext = path.extname(filename).toLowerCase();

    const contentTypes: { [key: string]: string } = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000");

    res.sendFile(filePath);
  } catch (error) {
    console.error("File serving error:", error);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;

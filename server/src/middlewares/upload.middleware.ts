import multer from "multer";
import path from "path";
import fs from "fs";

const tempDir = path.join(process.cwd(), "temp-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Only images, PDFs, and Word documents are allowed"));
    } else {
      cb(null, true);
    }
  },
});

export const manuscriptUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
      "application/x-tex",
      "text/x-tex",
      "application/x-latex",
      "text/plain",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".docx", ".pdf", ".tex", ".latex"];
    if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx, .pdf and .tex/.latex files are accepted"));
    }
  },
});

export const receiptUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or PDF receipts are accepted"));
  },
});

export const logoUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

export const certificationUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPG, and PNG files are accepted"));
  },
});

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import {
  globalLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
} from "./configs/rateLimiter";

import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";

// Routes
import authRoutes from "./Api/auth/auth.route";
import authorRoutes from "./Api/author/author.route";
import profileRoutes from "./Api/profile/profile.route";
import paperRoutes from "./Api/paper/paper.route";
import paperVersionRoutes from "./Api/paperVersion/paperVersion.route";
import journalRoutes from "./Api/journal/journal.route";
import journalIssueRoutes from "./Api/journalIssue/journalIssue.routes";
import publisherRoutes from "./Api/publisher/publisher.route";
import editorAssignmentRoutes from "./Api/editorAssignment/editorAssignment.routes";
import publicationRoutes from "./Api/publication/publication.routes";
import reviewerRoutes from "./Api/reviewer/reviewer.routes";

import archiveRoutes from "./Api/archive/archive.route";
import browseRoutes from "./Api/browse/browse.route";
import categoriesRoutes from "./Api/categories/categories.route";
import chiefEditorRoutes from "./Api/chiefEditor/chiefEditor.routes";
import conferenceRoutes from "./Api/conference/conference.route";
import contactRoutes from "./Api/contact/contact.route";
import invitationRoutes from "./Api/invitation/invitation.routes";
import journalCategoriesRoutes from "./Api/journalCategories/journalCategories.route";
import ownerRoutes from "./Api/owner/owner.route";
import paperApprovalRoutes from "./Api/paperApproval/paperApproval.route";
import paperPaymentRoutes from "./Api/paperPayment/paperPayment.routes";
import reviewAssignmentRoutes from "./Api/reviewAssignment/reviewAssignment.routes";
import subEditorRoutes from "./Api/subEditor/subEditor.routes";

import filesRoutes from "./routes/files.routes";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(globalLimiter);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running on Vercel",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/author", apiLimiter, authorRoutes);
app.use("/api/profile", apiLimiter, profileRoutes);
app.use("/api/paper", apiLimiter, paperRoutes);
app.use("/api/paper-version", apiLimiter, paperVersionRoutes);
app.use("/api/journal", apiLimiter, journalRoutes);
app.use("/api/journal-issue", apiLimiter, journalIssueRoutes);
app.use("/api/publisher", apiLimiter, publisherRoutes);
app.use("/api/editor-assignment", apiLimiter, editorAssignmentRoutes);
app.use("/api/publication", apiLimiter, publicationRoutes);
app.use("/api/reviewer", apiLimiter, reviewerRoutes);

app.use("/api/archive", apiLimiter, archiveRoutes);
app.use("/api/browse", apiLimiter, browseRoutes);
app.use("/api/categories", apiLimiter, categoriesRoutes);
app.use("/api/chief-editor", apiLimiter, chiefEditorRoutes);
app.use("/api/conference", apiLimiter, conferenceRoutes);
app.use("/api/contact", apiLimiter, contactRoutes);
app.use("/api/invitation", apiLimiter, invitationRoutes);
app.use("/api/journal-categories", apiLimiter, journalCategoriesRoutes);
app.use("/api/owner", apiLimiter, ownerRoutes);
app.use("/api/paper-approval", apiLimiter, paperApprovalRoutes);
app.use("/api/paper-payment", apiLimiter, paperPaymentRoutes);
app.use("/api/review-assignment", apiLimiter, reviewAssignmentRoutes);
app.use("/api/sub-editor", apiLimiter, subEditorRoutes);

app.use("/api/files", uploadLimiter, filesRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

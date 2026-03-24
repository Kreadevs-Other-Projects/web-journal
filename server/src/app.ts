import express, { NextFunction, Request, Response } from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./configs/envs";
import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { pool } from "./configs/db";
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
import reviewRoutes from "./Api/review/review.routes";
import reviewerRoutes from "./Api/reviewer/reviewer.routes";
import reviewAssignmentRoutes from "./Api/reviewAssignment/reviewAssignment.routes";
import chiefEditorRoutes from "./Api/chiefEditor/chiefEditor.routes";
import ownerRoutes from "./Api/owner/owner.route";
import subEditorRoutes from "./Api/subEditor/subEditor.routes";
import browseRoutes from "./Api/browse/browse.route";
import archiveRouter from "./Api/archive/archive.route";
import invitationRoutes from "./Api/invitation/invitation.routes";
// PAYMENT_DISABLED: import paperPaymentRoutes from "./Api/paperPayment/paperPayment.routes";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/api/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req: Request, res: Response) => {
  return res.json({ success: true, code: 200, message: "Healthy!" });
});
app.use("/", (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.path} ${req.method}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/author", authorRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/editorAssignment", editorAssignmentRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/paper-versions", paperVersionRoutes);
// PAYMENT_DISABLED: app.use("/api/paperPayment", paperPaymentRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/journal-issue", journalIssueRoutes);
app.use("/api/publisher", publisherRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/reviewer", reviewerRoutes);
app.use("/api/reviewAssignment", reviewAssignmentRoutes);
app.use("/api/chiefEditor", chiefEditorRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/subEditor", subEditorRoutes);
app.use("/api/browse", browseRoutes);
app.use("/api/archive", archiveRouter);
app.use("/api/invitations", invitationRoutes);

app.use(notFound);
app.use(errorHandler);

pool.on("connect", () => {
  console.log("Server is connected to Database");
});

export default app;

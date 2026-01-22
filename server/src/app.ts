import express, { NextFunction, Request, Response } from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./configs/envs";
import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { pool } from "./configs/db";
import authRoutes from "./routes/auth.route";
import profileRoutes from "./routes/profile.route";
import paperRoutes from "./routes/paper.route";
import paperVersionRoutes from "./routes/paperVersion.route";
import journalRoutes from "./routes/journal.route";
import journalIssueRoutes from "./routes/journalIssue.routes";
import publisherRoutes from "./routes/publisher.route";
import editorAssignmentRoutes from "./routes/editorAssignment.routes";
import publicationRoutes from "./routes/publication.routes";
import reviewRoutes from "./routes/review.routes";
import reviewerRoutes from "./routes/reviewer.routes";
import reviewAssignmentRoutes from "./routes/reviewAssignment.routes";
import cheifEditorRoutes from "./routes/cheifEditor.routes";
import ownerRoutes from "./routes/owner.route";
import subEditorRoutes from "./routes/subEditor.routes";

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
app.use("/api/profile", profileRoutes);
app.use("/api/editorAssignment", editorAssignmentRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/paper-versions", paperVersionRoutes);
//   app.use("/api/payment", paymentRoute);
app.use("/api/journal", journalRoutes);
app.use("/api/journal-issue", journalIssueRoutes);
app.use("/api/publisher", publisherRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/reviewer", reviewerRoutes);
app.use("/api/reviewAssignment", reviewAssignmentRoutes);
app.use("/api/cheifEditor", cheifEditorRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/subEditor", subEditorRoutes);

app.use(notFound);
app.use(errorHandler);

pool.on("connect", () => {
  console.log("Server is connected to Database");
});

export default app;

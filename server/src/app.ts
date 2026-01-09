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

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req: Request, res: Response) => {
  return res.json({ success: true, code: 200, message: "Healthy!" });
});
app.use("/", (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.path} ${req.method}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/paper-versions", paperVersionRoutes);
//   app.use("/api/payment", paymentRoute);
//   app.use("/api/journal", journalRoutes);
//   app.use("/api/author", authorRoute);
//   app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

pool.on("connect", () => {
  console.log("Server is connected to Database");
});

export default app;

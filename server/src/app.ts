import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./configs/envs";
import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { pool } from "./configs/db";
import authRoute from "./routes/auth.route";
import profileRoute from "./routes/profile.route";
import otpRoute from "./routes/otp.route";
import editRoute from "./routes/editorProfile.routes";
import reviewerRoutes from "./routes/reviewer.route";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));

app.get("/health", (req: Request, res: Response) => {
  return res.json({ success: true, code: 200, message: "Healthy!" });
});
app.use("/", (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.path} ${req.method}`);
  next();
});

app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/otp", otpRoute);
app.use("/api/edit", editRoute);
//   app.use("/api/payment", paymentRoute);
//   app.use("/api/journal", journalRoutes);
//   app.use("/api/author", authorRoute);
//   app.use("/api/editor", editorRoutes);
app.use("/api/reviewer", reviewerRoutes);
//   app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

pool.on("connect", () => {
  console.log("Server is connected to Database");
});

export default app;

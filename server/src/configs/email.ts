import nodemailer from "nodemailer";
import { env } from "./envs";

export const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
  debug: true, // shows full SMTP conversation
  logger: true,
});

export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("Email server is ready to send messages");
  } catch (error) {
    console.error("Email configuration error:", error);
  }
};

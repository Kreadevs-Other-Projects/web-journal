import nodemailer from "nodemailer";
import { env } from "./envs";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
  logger: true,
  debug: true,
});

export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("Email server is ready to send messages");
  } catch (error) {
    console.error("Email configuration error:", error);
  }
};

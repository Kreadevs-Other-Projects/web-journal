import nodemailer from "nodemailer";
import { env } from "./envs";

const emailHost = env.EMAIL_HOST || process.env.EMAIL_HOST;
const emailPort = Number(env.EMAIL_PORT || process.env.EMAIL_PORT || 465);
const emailUser = env.EMAIL_USER || process.env.EMAIL_USER;
const emailPassword = env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD;

if (!emailHost) {
  console.warn("EMAIL_HOST is missing.");
}

if (!emailUser) {
  console.warn("EMAIL_USER is missing.");
}

if (!emailPassword) {
  console.warn("EMAIL_PASSWORD is missing.");
}

export const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,

  pool: false,
});

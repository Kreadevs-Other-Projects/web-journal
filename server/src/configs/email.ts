import { Resend } from "resend";
import { env } from "./envs";

const resend = new Resend(env.RESEND_API_KEY);

export const transporter = {
  sendMail: async (options: {
    from?: string;
    to: string | string[];
    replyTo?: string;
    subject: string;
    html?: string;
    text?: string;
  }) => {
    const { data, error } = await resend.emails.send({
      from: options.from ?? env.EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    } as any);

    if (error) throw new Error(error.message);
    return data;
  },
};

export const verifyEmailConfig = async () => {
  try {
    // Resend doesn't need a verify step — just check the key exists
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
    console.log("Email service ready (Resend)");
  } catch (error) {
    console.error("Email configuration error:", error);
  }
};

// import nodemailer from "nodemailer";
// import { env } from "./envs";

// export const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: env.EMAIL_USER,
//     pass: env.EMAIL_PASSWORD,
//   },

//   logger: true,
//   debug: true,
// });

// export const verifyEmailConfig = async () => {
//   try {
//     await transporter.verify();
//     console.log("Email server is ready to send messages");
//   } catch (error) {
//     console.error("Email configuration error:", error);
//   }
// };

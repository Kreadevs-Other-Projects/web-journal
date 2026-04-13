import { Request, Response } from "express";
import { applyAsReviewerService } from "./contact.service";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";

export const sendContactMessage = async (req: Request, res: Response) => {
  const { name, email, department, subject, message } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }
  if (!subject || subject.trim().length < 3) {
    return res.status(400).json({ success: false, message: "Subject must be at least 3 characters" });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ success: false, message: "Message must be at least 10 characters" });
  }

  try {
    const year = new Date().getFullYear();

    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: env.EMAIL_USER,
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GIKI JournalHub</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 13px;">New Contact Form Submission</p>
          </div>
          <div style="padding: 35px 40px; background: #ffffff;">
            <h2 style="color: #1e3a5f; margin: 0 0 20px;">New Message from ${name}</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 130px;">From:</td>
                <td style="padding: 8px 0; font-size: 14px; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
              </tr>
              ${department ? `<tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Department:</td>
                <td style="padding: 8px 0; font-size: 14px;">${department}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subject:</td>
                <td style="padding: 8px 0; font-size: 14px; font-weight: 500;">${subject}</td>
              </tr>
            </table>
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
              <p style="color: #1e293b; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="margin-top: 20px; padding: 12px 16px; background: #eff6ff; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #1d4ed8;">Reply directly to this email to respond to ${name} at ${email}</p>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© ${year} GIKI JournalHub · Contact Form Submission</p>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: email,
      subject: `We received your message — GIKI JournalHub`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">GIKI JournalHub</h1>
          </div>
          <div style="padding: 35px 40px; background: #ffffff;">
            <h2 style="color: #1e3a5f; margin: 0 0 16px;">Thank you, ${name}!</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.7;">
              We have received your message and will get back to you as soon as possible.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Your subject</p>
              <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1e293b;">${subject}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If your inquiry is urgent, please contact us directly at
              <a href="mailto:${env.EMAIL_USER}" style="color: #2563eb;">${env.EMAIL_USER}</a>
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">© ${year} GIKI JournalHub · This is an automated confirmation</p>
          </div>
        </div>
      `,
    });

    return res.json({ success: true, message: "Message sent successfully" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: "Failed to send message. Please try again." });
  }
};

export const applyAsReviewer = async (req: Request, res: Response) => {
  try {
    const { journalId, name, email, statement, affiliation, orcid } = req.body;
    const appliedRole = req.body.applied_role === "associate_editor" ? "associate_editor" : "reviewer";

    if (!journalId || !name || !email) {
      return res.status(400).json({ success: false, message: "journalId, name and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    // Parse array fields (sent as JSON strings or repeated fields)
    let degrees: string[] = [];
    let keywords: string[] = [];

    if (req.body.degrees) {
      degrees = Array.isArray(req.body.degrees)
        ? req.body.degrees
        : JSON.parse(req.body.degrees);
    }
    if (req.body.keywords) {
      keywords = Array.isArray(req.body.keywords)
        ? req.body.keywords
        : JSON.parse(req.body.keywords);
    }

    if (keywords.length > 5) {
      return res.status(400).json({ success: false, message: "Maximum 5 keywords allowed" });
    }
    if (degrees.length > 5) {
      return res.status(400).json({ success: false, message: "Maximum 5 degrees allowed" });
    }

    const profilePicPath = req.file?.path;

    const result = await applyAsReviewerService({
      journalId,
      name,
      email,
      degrees,
      keywords,
      statement,
      affiliation,
      orcid,
      profilePicPath,
      appliedRole,
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      journalName: result.journalName,
    });
  } catch (e: any) {
    const status = e.message === "Journal not found" ? 404 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};

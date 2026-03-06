import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

export const sendWelcomeEmail = async (
  email: string,
  username: string,
  password: string,
) => {
  try {
    await transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to GIKI JournalHub",
      html: baseEmailTemplate(
        "Welcome to GIKI JournalHub",
        `
          <p>Hi <strong>${username}</strong>,</p>
          <p>Welcome to <strong>GIKI JournalHub</strong> — your platform for scientific publishing and peer review.</p>
          <p>You can now submit, review, and manage your research papers with confidence.</p>
          <p><strong>Your temporary password:</strong></p>
          <div class="code">${password}</div>
          <p>Please change your password after logging in for security.</p>
        `,
      ),
      text: `Hi ${username}, welcome to GIKI JournalHub! Your temporary password is: ${password}. Please change it after logging in.`,
    });
    console.log("Welcome email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
};

export const sendSubEditorInviteEmail = async (
  email: string,
  signupLink: string,
) => {
  try {
    await transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "You're invited to join GIKI JournalHub as a Sub-Editor",
      html: baseEmailTemplate(
        "Invitation to GIKI JournalHub",
        `
          <p>Hello,</p>
          <p>You have been invited to join <strong>GIKI JournalHub</strong> as a <strong>Sub-Editor</strong>.</p>
          <p>Click the button below to complete your signup and start managing papers:</p>
          <a href="${signupLink}" class="button">Complete Signup</a>
          <p>If you didn't expect this email, you can safely ignore it.</p>
        `,
      ),
      text: `You have been invited to join GIKI JournalHub as a Sub-Editor. Complete your signup here: ${signupLink}`,
    });
    console.log("Sub-editor invite email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send sub-editor invite email:", error);
    throw new Error("Sub-editor invite email failed");
  }
};

export const sendReviewerInviteEmail = async (
  email: string,
  signupLink: string,
) => {
  try {
    await transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "You're invited to join GIKI JournalHub as a Reviewer",
      html: baseEmailTemplate(
        "Invitation to GIKI JournalHub",
        `
          <p>Hello,</p>
          <p>You have been invited to join <strong>GIKI JournalHub</strong> as a <strong>Reviewer</strong>.</p>
          <p>As a reviewer, you'll be responsible for evaluating submitted papers and providing feedback.</p>
          <p>Click the button below to complete your signup:</p>
          <a href="${signupLink}" class="button">Complete Signup</a>
          <p>If you didn't expect this email, you can safely ignore it.</p>
        `,
      ),
      text: `You have been invited to join GIKI JournalHub as a Reviewer. Complete your signup here: ${signupLink}`,
    });
    console.log("Reviewer invite email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send reviewer invite email:", error);
    throw new Error("Reviewer invite email failed");
  }
};

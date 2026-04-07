import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

export const sendWelcomeEmail = async (
  email: string,
  username: string,
  _password: string, // kept for backwards-compat; no longer included in email
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
          <p>Your account is now active. You can log in with your email and the password you set when accepting your invitation.</p>
        `,
      ),
      text: `Hi ${username}, welcome to GIKI JournalHub! You can now log in with your email address.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
};

const ROLE_DISPLAY: Record<string, string> = {
  chief_editor: "Editor-in-Chief",
  journal_manager: "Journal Manager",
  sub_editor: "Associate Editor",
  reviewer: "Reviewer",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const sendInvitationEmail = async (params: {
  to: string;
  name: string;
  invitedByName: string;
  journalName: string;
  role: string;
  expiresAt: Date | string;
  acceptLink: string;
}) => {
  const { to, name, invitedByName, journalName, role, expiresAt, acceptLink } =
    params;
  const roleLabel = ROLE_DISPLAY[role] || role;
  try {
    await transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to,
      subject: `You have been invited to join ${journalName} on GIKI JournalHub`,
      html: baseEmailTemplate(
        "You've Been Invited",
        `
          <p>Hi <strong>${name}</strong>,</p>
          <p><strong>${invitedByName}</strong> has invited you to join <strong>${journalName}</strong> as <strong>${roleLabel}</strong>.</p>
          <p>This invitation expires on <strong>${formatDate(expiresAt)}</strong>.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <a href="${acceptLink}" class="button">Accept Invitation &amp; Create Account</a>
          <p style="margin-top:24px;font-size:13px;color:#9CA3AF;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        `,
      ),
      text: `Hi ${name}, you have been invited to join ${journalName} as ${roleLabel}. Accept here: ${acceptLink} (expires ${formatDate(expiresAt)})`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send invitation email:", error);
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
    return true;
  } catch (error) {
    console.error("Failed to send reviewer invite email:", error);
    throw new Error("Reviewer invite email failed");
  }
};

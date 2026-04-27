import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

// 1. Submission Confirmation
export const sendSubmissionConfirmationEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  submissionId: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Paper Submission Confirmed",
      html: baseEmailTemplate(
        "Submission Confirmed",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>Your paper has been successfully submitted to <strong>Paperuno</strong>.</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Submission ID:</strong> ${submissionId}</p>
          <p>Our editorial team will review your submission and assign an editor shortly.</p>
          <a href="${env.CORS_ORIGIN}/dashboard/submissions" class="button">View Submission</a>
        `,
      ),
      text: `Dear ${username}, your paper "${paperTitle}" (ID: ${submissionId}) has been submitted successfully.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send submission confirmation email:", error);
    throw new Error("Submission confirmation email failed");
  }
};

// 2. Editor Assignment
export const sendEditorAssignmentEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  editorName: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Editor Assigned to Your Paper",
      html: baseEmailTemplate(
        "Editor Assigned",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>An editor has been assigned to your submitted paper.</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Assigned Editor:</strong> ${editorName}</p>
          <p>The editor will manage the peer review process for your submission. You will be notified of any updates.</p>
          <a href="${env.CORS_ORIGIN}/dashboard/submissions" class="button">View Submission</a>
        `,
      ),
      text: `Dear ${username}, editor "${editorName}" has been assigned to your paper "${paperTitle}".`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send editor assignment email:", error);
    throw new Error("Editor assignment email failed");
  }
};

// 3. Reviewer Invitation (for assigned reviewer)
export const sendReviewerAssignmentEmail = async (
  email: string,
  reviewerName: string,
  paperTitle: string,
  reviewDeadline: string,
  reviewLink: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Invitation to Review a Paper – Paperuno",
      html: baseEmailTemplate(
        "Reviewer Invitation",
        `
          <p>Dear <strong>${reviewerName}</strong>,</p>
          <p>You have been invited to review the following paper submitted to <strong>Paperuno</strong>:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Review Deadline:</strong> ${reviewDeadline}</p>
          <p>Please click the button below to access the paper and submit your review:</p>
          <a href="${reviewLink}" class="button">Start Review</a>
          <p>If you are unable to review, please decline at your earliest convenience so we can find an alternative reviewer.</p>
        `,
      ),
      text: `Dear ${reviewerName}, you have been invited to review "${paperTitle}". Deadline: ${reviewDeadline}. Review here: ${reviewLink}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send reviewer assignment email:", error);
    throw new Error("Reviewer assignment email failed");
  }
};

// 4. Reviewer Reminder
export const sendReviewerReminderEmail = async (
  email: string,
  reviewerName: string,
  paperTitle: string,
  reviewDeadline: string,
  reviewLink: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Reminder: Review Deadline Approaching – Paperuno",
      html: baseEmailTemplate(
        "Review Reminder",
        `
          <p>Dear <strong>${reviewerName}</strong>,</p>
          <p>This is a friendly reminder that your review for the following paper is due soon:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Review Deadline:</strong> <strong>${reviewDeadline}</strong></p>
          <p>Please submit your review before the deadline to avoid delays in the publication process.</p>
          <a href="${reviewLink}" class="button">Submit Review</a>
          <p>If you are unable to complete the review, please notify us immediately.</p>
        `,
      ),
      text: `Dear ${reviewerName}, reminder: your review for "${paperTitle}" is due on ${reviewDeadline}. Submit here: ${reviewLink}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send reviewer reminder email:", error);
    throw new Error("Reviewer reminder email failed");
  }
};

// 5. Review Submission Confirmation (for reviewer)
export const sendReviewSubmissionConfirmationEmail = async (
  email: string,
  reviewerName: string,
  paperTitle: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Review Submitted Successfully – Paperuno",
      html: baseEmailTemplate(
        "Review Submitted",
        `
          <p>Dear <strong>${reviewerName}</strong>,</p>
          <p>Thank you for submitting your review for the following paper:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p>Your review has been received and will be considered by the editorial team in making their decision.</p>
          <p>We appreciate your contribution to the peer review process at <strong>Paperuno</strong>.</p>
        `,
      ),
      text: `Dear ${reviewerName}, your review for "${paperTitle}" has been submitted successfully. Thank you.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send review submission confirmation:", error);
    throw new Error("Review submission confirmation email failed");
  }
};

// 6. Editorial Decision
export const sendEditorialDecisionEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  decision: "accepted" | "rejected" | "minor_revision" | "major_revision",
  comments?: string,
) => {
  const decisionLabels: Record<typeof decision, string> = {
    accepted: "Accepted",
    rejected: "Rejected",
    minor_revision: "Minor Revision Required",
    major_revision: "Major Revision Required",
  };

  const decisionColors: Record<typeof decision, string> = {
    accepted: "#16A34A",
    rejected: "#DC2626",
    minor_revision: "#D97706",
    major_revision: "#EA580C",
  };

  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: `Editorial Decision on Your Paper – ${decisionLabels[decision]}`,
      html: baseEmailTemplate(
        "Editorial Decision",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>The editorial team has reached a decision regarding your submitted paper:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Decision:</strong> <span style="color: ${decisionColors[decision]}; font-weight: bold;">${decisionLabels[decision]}</span></p>
          ${comments ? `<p><strong>Editor Comments:</strong></p><p style="background:#0B1220;padding:12px;border-radius:8px;border-left:3px solid #2563EB;">${comments}</p>` : ""}
          <a href="${env.CORS_ORIGIN}/dashboard/submissions" class="button">View Details</a>
        `,
      ),
      text: `Dear ${username}, decision on "${paperTitle}": ${decisionLabels[decision]}. ${comments ?? ""}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send editorial decision email:", error);
    throw new Error("Editorial decision email failed");
  }
};

// 7. Revision Request
export const sendRevisionRequestEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  revisionType: "minor" | "major",
  revisionDeadline: string,
  comments?: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: `Revision Requested for Your Paper – Paperuno`,
      html: baseEmailTemplate(
        `${revisionType === "minor" ? "Minor" : "Major"} Revision Requested`,
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>The editor has requested a <strong>${revisionType} revision</strong> for your paper:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Revision Deadline:</strong> ${revisionDeadline}</p>
          ${comments ? `<p><strong>Revision Notes:</strong></p><p style="background:#0B1220;padding:12px;border-radius:8px;border-left:3px solid #2563EB;">${comments}</p>` : ""}
          <p>Please submit your revised manuscript before the deadline.</p>
          <a href="${env.CORS_ORIGIN}/dashboard/submissions" class="button">Submit Revision</a>
        `,
      ),
      text: `Dear ${username}, a ${revisionType} revision has been requested for "${paperTitle}". Deadline: ${revisionDeadline}. ${comments ?? ""}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send revision request email:", error);
    throw new Error("Revision request email failed");
  }
};

// 8. Acceptance Notice
export const sendAcceptanceNoticeEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  journalName: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Congratulations! Your Paper Has Been Accepted",
      html: baseEmailTemplate(
        "Paper Accepted 🎉",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>We are pleased to inform you that your paper has been <strong style="color:#16A34A;">accepted</strong> for publication in <strong>${journalName}</strong>.</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p>The next steps include proof review and final publication. You will be notified when your proof is ready.</p>
          <a href="${env.CORS_ORIGIN}/dashboard/submissions" class="button">View Submission</a>
          <p>Congratulations and thank you for choosing <strong>Paperuno</strong>!</p>
        `,
      ),
      text: `Dear ${username}, congratulations! Your paper "${paperTitle}" has been accepted for publication in ${journalName}.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send acceptance notice email:", error);
    throw new Error("Acceptance notice email failed");
  }
};

// 9. Proof Availability
export const sendProofAvailabilityEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  proofLink: string,
  proofDeadline: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Proof Ready for Review – Paperuno",
      html: baseEmailTemplate(
        "Proof Available",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>The proof for your accepted paper is now available for review:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Proof Review Deadline:</strong> ${proofDeadline}</p>
          <p>Please review the proof carefully and submit any corrections before the deadline.</p>
          <a href="${proofLink}" class="button">Review Proof</a>
          <p>Only minor typographical corrections are permitted at this stage.</p>
        `,
      ),
      text: `Dear ${username}, the proof for "${paperTitle}" is ready. Review by ${proofDeadline}: ${proofLink}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send proof availability email:", error);
    throw new Error("Proof availability email failed");
  }
};

// 10. Publication Confirmation
export const sendPublicationConfirmationEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  journalName: string,
  issueLabel: string,
  publicationLink: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Paper Has Been Published – Paperuno",
      html: baseEmailTemplate(
        "Paper Published 🎉",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>We are delighted to announce that your paper has been officially <strong style="color:#16A34A;">published</strong>!</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>Journal:</strong> ${journalName}</p>
          <p><strong>Issue:</strong> ${issueLabel}</p>
          <p>Your work is now accessible to the global research community.</p>
          <a href="${publicationLink}" class="button">View Published Paper</a>
          <p>Thank you for publishing with <strong>Paperuno</strong>.</p>
        `,
      ),
      text: `Dear ${username}, your paper "${paperTitle}" has been published in ${journalName} (${issueLabel}). View it here: ${publicationLink}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send publication confirmation email:", error);
    throw new Error("Publication confirmation email failed");
  }
};

// 11. Corresponding Author Approval Request
export const sendCorrAuthorApprovalEmail = async (opts: {
  corrAuthorEmail: string;
  corrAuthorName: string;
  paperTitle: string;
  authorName: string;
  journalName: string;
  approvalToken: string;
  hasAccount: boolean;
  abstract?: string;
  allAuthors?: string;
  submissionDate?: string;
}) => {
  const approvalUrl = `${env.FRONTEND_URL}/paper-approval/${opts.approvalToken}`;
  const year = new Date().getFullYear();
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Paperuno</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 13px;">Corresponding Author Approval Required</p>
  </div>
  <div style="padding: 35px 40px; background: #ffffff;">
    <h2 style="color: #1e3a5f; margin: 0 0 8px;">Your Approval is Required</h2>
    <p>Dear <strong>${opts.corrAuthorName}</strong>,</p>
    <p>You have been listed as the corresponding author for the following manuscript submitted to <strong>${opts.journalName}</strong>.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; color: #1e3a5f; font-size: 18px;">${opts.paperTitle}</h3>

      <table style="width: 100%; font-size: 13px; margin-bottom: 16px; border-collapse: collapse;">
        <tr>
          <td style="color: #6b7280; padding: 4px 0; width: 140px; vertical-align: top;">Journal:</td>
          <td style="font-weight: 500;">${opts.journalName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; padding: 4px 0; vertical-align: top;">Submitted by:</td>
          <td>${opts.authorName}</td>
        </tr>
        ${
          opts.allAuthors
            ? `<tr>
          <td style="color: #6b7280; padding: 4px 0; vertical-align: top;">All Authors:</td>
          <td>${opts.allAuthors}</td>
        </tr>`
            : ""
        }
        ${
          opts.submissionDate
            ? `<tr>
          <td style="color: #6b7280; padding: 4px 0; vertical-align: top;">Submission Date:</td>
          <td>${opts.submissionDate}</td>
        </tr>`
            : ""
        }
      </table>

      ${
        opts.abstract
          ? `
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Abstract</p>
        <p style="font-size: 14px; line-height: 1.7; color: #374151; margin: 0;">${opts.abstract}</p>
      </div>`
          : ""
      }
    </div>

    <p style="font-weight: 500;">As corresponding author, please review and approve or reject this submission:</p>

    ${!opts.hasAccount ? `<p style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;font-size:13px;">You don't have a Paperuno account yet. Please create one to approve this submission.</p>` : ""}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${approvalUrl}"
         style="background: #2563eb; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        ${!opts.hasAccount ? "Create Account &amp; Approve" : "Review &amp; Respond"}
      </a>
    </div>

    <p style="color: #6b7280; font-size: 13px;">This link expires in 7 days. If you did not expect this email, please ignore it.</p>
  </div>
  <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">© ${year} Paperuno</p>
  </div>
</div>`;

  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: opts.corrAuthorEmail,
      subject: `Corresponding Author Approval Required — ${opts.paperTitle}`,
      html,
      text: `Dear ${opts.corrAuthorName}, you have been listed as corresponding author for "${opts.paperTitle}". Please approve or reject here: ${approvalUrl}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send CA approval email:", error);
    throw error;
  }
};

// 12. Notify submitting author — CA approved
export const sendCAApprovedNotificationEmail = async (
  email: string,
  authorName: string,
  paperTitle: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Paper Has Been Approved by the Corresponding Author",
      html: baseEmailTemplate(
        "Paper Approved — Now Under Editorial Review",
        `
          <p>Dear <strong>${authorName}</strong>,</p>
          <p>Great news! The corresponding author has <strong style="color:#16A34A;">approved</strong> your paper submission.</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p>Your paper is now officially submitted and will be assigned to an editor for review shortly.</p>
          <a href="${env.CORS_ORIGIN}/author/track" class="button">Track Your Submission</a>
        `,
      ),
      text: `Dear ${authorName}, the corresponding author has approved "${paperTitle}". Your paper is now under editorial review.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send CA approved notification:", error);
    throw error;
  }
};

// 13. Notify submitting author — CA rejected
export const sendCARejectedNotificationEmail = async (
  email: string,
  authorName: string,
  paperTitle: string,
  reason?: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Your Paper Submission Was Rejected by the Corresponding Author",
      html: baseEmailTemplate(
        "Paper Submission Rejected",
        `
          <p>Dear <strong>${authorName}</strong>,</p>
          <p>The corresponding author has <strong style="color:#DC2626;">rejected</strong> your paper submission.</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>If you believe this was an error, please contact the corresponding author directly and resubmit.</p>
          <a href="${env.CORS_ORIGIN}/author" class="button">Go to Dashboard</a>
        `,
      ),
      text: `Dear ${authorName}, the corresponding author rejected "${paperTitle}".${reason ? ` Reason: ${reason}` : ""}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send CA rejected notification:", error);
    throw error;
  }
};

// 14. DOI Registration Confirmation
export const sendDOIRegistrationEmail = async (
  email: string,
  username: string,
  paperTitle: string,
  doi: string,
  doiLink: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "DOI Registered for Your Paper – Paperuno",
      html: baseEmailTemplate(
        "DOI Registration Confirmed",
        `
          <p>Dear <strong>${username}</strong>,</p>
          <p>A Digital Object Identifier (DOI) has been successfully registered for your paper:</p>
          <p><strong>Paper Title:</strong> ${paperTitle}</p>
          <p><strong>DOI:</strong></p>
          <div class="code">${doi}</div>
          <p>You can use this DOI to cite and share your work permanently.</p>
          <a href="${doiLink}" class="button">Access via DOI</a>
          <p>Congratulations on this milestone!</p>
        `,
      ),
      text: `Dear ${username}, DOI registered for "${paperTitle}": ${doi}. Access here: ${doiLink}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send DOI registration email:", error);
    throw new Error("DOI registration email failed");
  }
};

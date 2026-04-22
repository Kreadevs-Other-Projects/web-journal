import {
  getApprovalByToken,
  approveByToken,
  rejectByToken,
  getPaperAuthorForNotification,
} from "./paperApproval.repository";
import {
  sendCAApprovedNotificationEmail,
  sendCARejectedNotificationEmail,
  sendSubmissionConfirmationEmail,
} from "../../utils/emails/paperEmails";

export const getApprovalDetailsService = async (token: string) => {
  const approval = await getApprovalByToken(token);
  if (!approval) return null;

  return {
    token_valid: approval.status === "pending" && new Date(approval.expires_at) > new Date(),
    status: approval.status,
    paper: {
      id: approval.paper_id_val,
      title: approval.title,
      abstract: approval.abstract,
      journal_name: approval.journal_name,
      submitted_by: approval.submitted_by,
      submitted_at: approval.submitted_at,
      current_version_id: approval.current_version_id,
      authors: Array.isArray(approval.author_details) ? approval.author_details : [],
      author_details: Array.isArray(approval.author_details) ? approval.author_details : [],
    },
    corr_author: {
      name: approval.corr_author_name,
      email: approval.corr_author_email,
    },
  };
};

export const processApprovalService = async (token: string, action: "approve" | "reject", reason?: string) => {
  const approval = await getApprovalByToken(token);
  if (!approval) throw new Error("Approval token not found");
  if (approval.status !== "pending") throw new Error("This approval link has already been used");
  if (new Date(approval.expires_at) <= new Date()) throw new Error("This approval link has expired");

  if (action === "approve") {
    const paperId = await approveByToken(token);
    const info = await getPaperAuthorForNotification(paperId);
    if (info) {
      sendCAApprovedNotificationEmail(info.email, info.username, info.title).catch(
        (err) => console.error("[email] CA approved notification failed:", err),
      );
      sendSubmissionConfirmationEmail(info.email, info.username, info.title, paperId).catch(() => {});
    }
  } else {
    const paperId = await rejectByToken(token, reason || "No reason provided");
    const info = await getPaperAuthorForNotification(paperId);
    if (info) {
      sendCARejectedNotificationEmail(info.email, info.username, info.title, reason).catch(
        (err) => console.error("[email] CA rejected notification failed:", err),
      );
    }
  }
};

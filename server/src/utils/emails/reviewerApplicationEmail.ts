import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";

interface ReviewerApplicationData {
  journalName: string;
  applicantName: string;
  applicantEmail: string;
  affiliation?: string;
  orcid?: string;
  degrees: string[];
  keywords: string[];
  statement?: string;
  profilePicPath?: string;
  submittedAt: string;
}

export const sendReviewerApplicationToEditor = async (
  editorEmail: string,
  editorName: string,
  data: ReviewerApplicationData,
  frontendUrl: string,
): Promise<void> => {
  const degreesHtml = data.degrees.length
    ? `<ul style="margin:0;padding-left:20px;">${data.degrees.map((d) => `<li style="margin-bottom:4px;">${d}</li>`).join("")}</ul>`
    : "<em style='color:#9CA3AF;'>Not provided</em>";

  const keywordsHtml = data.keywords.length
    ? data.keywords
        .map(
          (k) =>
            `<span style="display:inline-block;background:#1E3A8A;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px;">${k}</span>`,
        )
        .join("")
    : "<em style='color:#9CA3AF;'>Not provided</em>";

  const profilePicHtml = data.profilePicPath
    ? `<img src="cid:profilepic" alt="Profile Picture" style="width:100px;height:133px;object-fit:cover;border-radius:6px;border:1px solid #374151;margin-bottom:16px;" />`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Reviewer Application</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1220;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:40px auto;background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1F2937;">
    <div style="padding:24px;text-align:center;background:linear-gradient(135deg,#1E3A8A,#2563EB);">
      <div style="font-size:22px;font-weight:bold;">New Reviewer Application</div>
      <div style="font-size:14px;margin-top:6px;opacity:0.85;">${data.journalName}</div>
    </div>

    <div style="padding:24px;">
      <p style="color:#E5E7EB;margin-top:0;">Dear ${editorName},</p>
      <p style="color:#E5E7EB;">A new reviewer application has been submitted for <strong>${data.journalName}</strong>.</p>

      ${profilePicHtml}

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:1px solid #1F2937;">
          <td style="padding:10px 8px;color:#9CA3AF;font-size:13px;width:140px;">Full Name</td>
          <td style="padding:10px 8px;color:#E5E7EB;font-size:14px;font-weight:600;">${data.applicantName}</td>
        </tr>
        <tr style="border-bottom:1px solid #1F2937;">
          <td style="padding:10px 8px;color:#9CA3AF;font-size:13px;">Email</td>
          <td style="padding:10px 8px;font-size:14px;"><a href="mailto:${data.applicantEmail}" style="color:#2563EB;">${data.applicantEmail}</a></td>
        </tr>
        <tr style="border-bottom:1px solid #1F2937;">
          <td style="padding:10px 8px;color:#9CA3AF;font-size:13px;">Affiliation</td>
          <td style="padding:10px 8px;color:#E5E7EB;font-size:14px;">${data.affiliation || "<em style='color:#6B7280;'>Not provided</em>"}</td>
        </tr>
        <tr style="border-bottom:1px solid #1F2937;">
          <td style="padding:10px 8px;color:#9CA3AF;font-size:13px;">ORCID</td>
          <td style="padding:10px 8px;color:#E5E7EB;font-size:14px;">${data.orcid || "<em style='color:#6B7280;'>Not provided</em>"}</td>
        </tr>
      </table>

      <div style="margin:20px 0;">
        <p style="color:#9CA3AF;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Degrees</p>
        <div style="color:#E5E7EB;font-size:14px;">${degreesHtml}</div>
      </div>

      <div style="margin:20px 0;">
        <p style="color:#9CA3AF;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Areas of Expertise</p>
        <div>${keywordsHtml}</div>
      </div>

      ${
        data.statement
          ? `<div style="margin:20px 0;padding:16px;background:#0B1220;border-radius:8px;border:1px solid #1F2937;">
        <p style="color:#9CA3AF;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Research Background</p>
        <p style="color:#E5E7EB;font-size:14px;line-height:1.6;margin:0;">${data.statement}</p>
      </div>`
          : ""
      }

      <div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${frontendUrl}/chief-editor" style="display:inline-block;padding:10px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">View in Dashboard</a>
        <a href="mailto:${data.applicantEmail}" style="display:inline-block;padding:10px 20px;background:#374151;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Reply to Applicant</a>
      </div>
    </div>

    <div style="padding:20px;text-align:center;font-size:12px;color:#6B7280;border-top:1px solid #1F2937;">
      This application was submitted via ${data.journalName} public page on ${data.submittedAt}<br />
      © ${new Date().getFullYear()} GIKI JournalHub
    </div>
  </div>
</body>
</html>`;

  const mailOptions: any = {
    from: `"GIKI JournalHub" <${env.EMAIL_USER}>`,
    to: editorEmail,
    replyTo: data.applicantEmail,
    subject: `New Reviewer Application for ${data.journalName} — ${data.applicantName}`,
    html,
  };

  if (data.profilePicPath) {
    mailOptions.attachments = [
      {
        filename: "profile-picture.jpg",
        path: data.profilePicPath,
        cid: "profilepic",
      },
    ];
  }

  await transporter.sendMail(mailOptions);
};

export const sendReviewerApplicationConfirmation = async (
  applicantEmail: string,
  applicantName: string,
  journalName: string,
  submittedAt: string,
): Promise<void> => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Application Received</title></head>
<body style="margin:0;padding:0;background:#0B1220;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:40px auto;background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1F2937;">
    <div style="padding:24px;text-align:center;background:linear-gradient(135deg,#1E3A8A,#2563EB);font-size:22px;font-weight:bold;">
      Application Received
    </div>
    <div style="padding:28px;color:#E5E7EB;line-height:1.7;">
      <p>Dear <strong>${applicantName}</strong>,</p>
      <p>Thank you for applying to review for <strong>${journalName}</strong>.</p>
      <p>Your application has been forwarded to the editorial team for review.</p>
      <p>You will be contacted at <a href="mailto:${applicantEmail}" style="color:#2563EB;">${applicantEmail}</a> if your application is successful.</p>
      <div style="margin:24px 0;padding:16px;background:#0B1220;border-radius:8px;border:1px solid #1F2937;">
        <p style="margin:0;color:#9CA3AF;font-size:13px;">Application submitted: ${submittedAt}</p>
      </div>
      <p style="color:#9CA3AF;font-size:13px;">If you have questions, please contact the editorial team directly.</p>
    </div>
    <div style="padding:20px;text-align:center;font-size:12px;color:#6B7280;border-top:1px solid #1F2937;">
      © ${new Date().getFullYear()} GIKI JournalHub. This is an automated email.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_USER}>`,
    to: applicantEmail,
    subject: `Your reviewer application for ${journalName} has been received`,
    html,
  });
};

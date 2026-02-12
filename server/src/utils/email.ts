import { transporter } from "../configs/email";
import { env } from "../configs/envs";

const baseEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0B1220;
      font-family: Arial, sans-serif;
      color: #FFFFFF;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #111827;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1F2937;
    }
    .header {
      padding: 24px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      background: linear-gradient(135deg, #1E3A8A, #2563EB);
    }
    .content {
      padding: 24px;
      font-size: 15px;
      line-height: 1.6;
      color: #E5E7EB;
    }
    .code {
      margin: 24px 0;
      padding: 16px;
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #2563EB;
      background-color: #0B1220;
      border-radius: 8px;
      border: 1px dashed #2563EB;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background-color: #2563EB;
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
      border-top: 1px solid #1F2937;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">${title}</div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} JournalHub. This is an automated email.
    </div>
  </div>
</body>
</html>
`;

export const sendOTPEmail = async (email: string, otpCode: string) => {
  try {
    await transporter.sendMail({
      from: `"JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Your OTP Code",
      html: baseEmailTemplate(
        "OTP Verification",
        `
          <p>Hello,</p>
          <p>Please use the following code to verify your email:</p>
          <div class="code">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
        `,
      ),
      text: `Your OTP code is ${otpCode}. It will expire in 10 minutes.`,
    });

    console.log("OTP email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("OTP email sending failed");
  }
};

export const sendWelcomeEmail = async (
  email: string,
  username: string,
  password: string,
) => {
  try {
    await transporter.sendMail({
      from: `"JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to JournalHub",
      html: baseEmailTemplate(
        "Welcome to JournalHub",
        `
          <p>Hi <strong>${username}</strong>,</p>
          <p>Welcome to <strong>JournalHub</strong> — your platform for scientific publishing and peer review.</p>
          <p>You can now submit, review, and manage your research papers with confidence.</p>

          <p><strong>Your temporary password:</strong></p>
          <div class="code">${password}</div>

          <p>Please change your password after logging in for security.</p>
        `,
      ),
      text: `Hi ${username}, welcome to JournalHub! Your temporary password is: ${password}. Please change it after logging in.`,
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
      from: `"JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "You're invited to join JournalHub as a Sub-Editor",
      html: baseEmailTemplate(
        "Invitation to JournalHub",
        `
          <p>Hello,</p>
          <p>You have been invited to join <strong>JournalHub</strong> as a <strong>Sub-Editor</strong>.</p>
          <p>Click the button below to complete your signup and start managing papers:</p>
          <a href="${signupLink}" class="button">Complete Signup</a>
          <p>If you didn’t expect this email, you can safely ignore it.</p>
        `,
      ),
      text: `Hello, You have been invited to join JournalHub as a Sub-Editor. Complete your signup here: ${signupLink}`,
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
      from: `"JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "You're invited to join JournalHub as a Reviewer",
      html: baseEmailTemplate(
        "Invitation to JournalHub",
        `
          <p>Hello,</p>
          <p>
            You have been invited to join <strong>JournalHub</strong> as a
            <strong>Reviewer</strong>.
          </p>
          <p>
            As a reviewer, you’ll be responsible for evaluating submitted papers
            and providing feedback.
          </p>
          <p>Click the button below to complete your signup:</p>
          <a href="${signupLink}" class="button">Complete Signup</a>
          <p>If you didn’t expect this email, you can safely ignore it.</p>
        `,
      ),
      text: `Hello, You have been invited to join JournalHub as a Reviewer. Complete your signup here: ${signupLink}`,
    });

    console.log("Reviewer invite email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send reviewer invite email:", error);
    throw new Error("Reviewer invite email failed");
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  otpCode: string,
) => {
  try {
    await transporter.sendMail({
      from: `"JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Password Reset Request",
      html: baseEmailTemplate(
        "Password Reset",
        `
          <p>Hello,</p>
          <p>You requested to reset your password. Use the code below:</p>
          <div class="code">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If this wasn’t you, please ignore this email.</p>
        `,
      ),
      text: `Your password reset code is ${otpCode}. It will expire in 10 minutes.`,
    });

    console.log("Password reset email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Password reset email failed");
  }
};

export const sendInvoiceEmail = async ({
  email,
  username,
  journalName,
  issueLabel,
  amount,
  currency,
  invoiceId,
  status,
}: {
  email: string;
  username: string;
  journalName: string;
  issueLabel: string;
  amount: number;
  currency: string;
  invoiceId: string;
  status: string;
}) => {
  await transporter.sendMail({
    from: `"JournalHub" <${env.EMAIL_FROM}>`,
    to: email,
    subject: `Invoice for Journal Issue (${status.toUpperCase()})`,
    html: baseEmailTemplate(
      "Journal Issue Invoice",
      `
      <p>Hi <strong>${username}</strong>,</p>

      <p>You have applied for a new journal issue. Below are the invoice details:</p>

      <p><strong>Journal:</strong> ${journalName}</p>
      <p><strong>Issue:</strong> ${issueLabel}</p>
      <p><strong>Invoice ID:</strong> ${invoiceId}</p>
      <p><strong>Amount:</strong> ${amount} ${currency}</p>
      <p><strong>Status:</strong> <strong>${status.toUpperCase()}</strong></p>

      <a href="${env.CORS_ORIGIN}/dashboard/payments" class="button">
        Pay Now
      </a>

      <p>If unpaid, your issue will remain <strong>Pending</strong>.</p>
      `,
    ),
    text: `Invoice ${invoiceId} | Amount ${amount} ${currency} | Status ${status}`,
  });
};

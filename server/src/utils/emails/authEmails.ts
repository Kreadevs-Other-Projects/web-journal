import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

export const sendOTPEmail = async (email: string, otpCode: string) => {
  try {
    await transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Your OTP Code",
      html: baseEmailTemplate(
        "OTP Verification",
        `
          <p>Hello,</p>
          <p>Please use the following code to verify your email:</p>
          <div class="code">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
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

export const sendPasswordResetEmail = async (
  email: string,
  otpCode: string,
) => {
  try {
    await transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Password Reset Request",
      html: baseEmailTemplate(
        "Password Reset",
        `
          <p>Hello,</p>
          <p>You requested to reset your password. Use the code below:</p>
          <div class="code">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If this wasn't you, please ignore this email.</p>
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
